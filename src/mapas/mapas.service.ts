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

      if (foundMapaDesactivated) {
        //REACTIVAR EL MAPA Y ACTUALIZAR SUS CAMPOS
        await foundMapaDesactivated.updateOne(
          {
            isActive: true,
            ...createMapaDto,
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
      const mapa = await this._mapaModel.create([createMapaDto], { session });

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
    let result: any;

    if (name) {
      result = await this._mapaModel
        .find({
          isActive: true,
          $or: [{ name: { $regex: `^${name}`, $options: 'i' } }],
        })
        .skip(offset)
        .limit(limit)
        .exec();

      return result;
    }

    result = await this._mapaModel
      .find({ isActive: true })
      .skip(offset)
      .limit(limit)
      .exec();

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
      const updatedMapa = await mapa.updateOne(updateMapaDto);

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
