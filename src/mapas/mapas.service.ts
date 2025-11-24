import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateMapaDto } from './dto/create-mapa.dto';
import { UpdateMapaDto } from './dto/update-mapa.dto';
import { Mapa } from './entities/mapa.entity';
import mongoose, { Model } from 'mongoose';
import { InjectConnection, InjectModel } from '@nestjs/mongoose';
import { CommonService } from 'src/common/common.service';
import { PaginationDto } from 'src/common/dto/pagination.dto';

@Injectable()
export class MapasService {
  constructor(
    @InjectModel(Mapa.name) private _mapaModel: Model<Mapa>,
    @InjectConnection() private readonly connection: mongoose.Connection,
    private readonly commonService: CommonService,
  ) {}

  async create(createMapaDto: CreateMapaDto) {
    const session = await this.connection.startSession();
    session.startTransaction();

    try {
      //BUSCAR SI EXISTE UN MAP DESACTIVADO CON EL MISMO NOMBRE
      const foundMapaDesactivated = await this._mapaModel.findOne({
        isActive: false,
        name: createMapaDto.name,
      });

      //CALCULAR amountSubmaps BASADO EN mapsInternal
      const amountSubmaps = createMapaDto.mapsInternal
        ? createMapaDto.mapsInternal.length
        : 0;

      const mapaData = {
        ...createMapaDto,
        amountSubmaps,
      };

      if (foundMapaDesactivated) {
        //REACTIVAR EL MAPA Y ACTUALIZAR SUS CAMPOS
        await foundMapaDesactivated.updateOne(
          {
            isActive: true,
            ...mapaData,
          },
          { session },
        );

        //CONFIRMANDO LA TRANSACCION
        await session.commitTransaction();

        //RETORNAMOS EL MAPA ACTUALIZADO
        const mapaRecreated = await this._mapaModel.findById(
          foundMapaDesactivated._id,
        );

        return mapaRecreated;
      }

      //SI NO EXISTE, CREAR NORMALMENTE
      const mapa = await this._mapaModel.create([mapaData], { session });

      //CONFIRMANDO LA TRANSACCION
      await session.commitTransaction();

      //RETORNAMOS EL MAPA CREADO OBJETO [0]
      return mapa[0];
    } catch (error) {
      this.commonService.handleExceptions(error);
      //ABORTANDO TODOS LOS CAMBIOS A BASE DE DATOS
      session.abortTransaction();
    } finally {
      await session.endSession();
    }
  }

  async findAll(paginationDto: PaginationDto) {
    const { limit = 10, offset = 0, name } = paginationDto;

    const filter: any = { isActive: true };
    if (name) {
      filter.$or = [{ name: { $regex: `^${name}`, $options: 'i' } }];
    }

    const result = await this._mapaModel.aggregate([
      { $match: filter },
      { $skip: offset },
      { $limit: limit },
      {
        $lookup: {
          from: 'enlaces',
          let: { deviceIds: '$Devices' },
          pipeline: [
            { $match: { $expr: { $in: ['$DeviceOrigen', '$$deviceIds'] } } },
            { $project: { _id: 1 } },
          ],
          as: 'EnlacesOrigen',
        },
      },
      {
        $addFields: {
          AmountDevices: { $size: { $ifNull: ['$Devices', []] } },
          AmountEnlaces: { $size: '$EnlacesOrigen' },
          Enlaces: {
            $map: { input: '$EnlacesOrigen', as: 'e', in: '$$e._id' },
          },
        },
      },
      {
        $project: {
          name: 1,
          latitude: 1,
          longitude: 1,
          position: 1,
          isActive: 1,
          Devices: 1,
          AmountDevices: 1,
          Enlaces: 1,
          AmountEnlaces: 1,
          StatusDevices: 1,
          createdAt: 1,
          updatedAt: 1,
        },
      },
    ]);

    return result;
  }

  async findById(id: string) {
    const mapa = await this._mapaModel
      .findOne({
        _id: id,
        isActive: true,
      })
      .exec();

    if (!mapa) throw new NotFoundException(`Mapa with id ${id} not found`);

    return mapa;
  }

  async findAllDevicesInMapa(id: string, paginationDto: PaginationDto) {
    const { limit = 10, offset = 0, name } = paginationDto;

    const mapa = await this._mapaModel
      .findOne({
        _id: id,
        isActive: true,
      })
      .populate({
        path: 'Devices',
        match: name ? { name: { $regex: `^${name}`, $options: 'i' } } : {},
        options: {
          skip: offset,
          limit: limit,
        },
        populate: {
          path: 'enlaces',
          match: { isActive: true },
          select:
            'DeviceOrigen InterfaceOrigen DevicesInterfacesDestination tipoMedio idsnmp lastStatus isActive',
          populate: {
            path: 'DevicesInterfacesDestination',
            select: 'DeviceDestino InterfaceDestino isActive',
            populate: {
              path: 'DeviceDestino',
              select: 'name ip isActive',
            },
          },
        },
      })
      .select('Devices')
      .exec();

    if (!mapa) throw new NotFoundException(`Mapa with id ${id} not found`);

    return mapa.Devices;
  }

  async update(id: string, updateMapaDto: UpdateMapaDto) {
    try {
      const mapa = await this.findById(id);

      //SI mapsInternal VIENE EN EL UPDATE, CALCULAR amountSubmaps
      const updateData: any = { ...updateMapaDto };
      if (updateMapaDto.mapsInternal) {
        updateData['amountSubmaps'] = updateMapaDto.mapsInternal?.length || 0;
      }

      const updatedMapa = await mapa.updateOne(updateData);

      return updatedMapa;
    } catch (error) {
      this.commonService.handleExceptions(error);
    }
  }

  async remove(id: string) {
    const mapa = await this.findById(id);

    // ELIMINADO EL MAPA ENCONTRADO
    await mapa.updateOne({ isActive: false });

    return `Mapa ${mapa.name} Delete!`;
  }
}
