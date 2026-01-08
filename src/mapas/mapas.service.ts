import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { CreateMapaDto } from './dto/create-mapa.dto';
import { UpdateMapaDto } from './dto/update-mapa.dto';
import { Mapa } from './entities/mapa.entity';
import mongoose, { Model } from 'mongoose';
import { InjectConnection, InjectModel } from '@nestjs/mongoose';
import { CommonService } from 'src/common/common.service';
import { PaginationDto } from 'src/common/dto/pagination.dto';
import { STATUS } from 'src/common/enums/status.enum';

@Injectable()
export class MapasService {
  private readonly logger = new Logger(MapasService.name);

  constructor(
    @InjectModel(Mapa.name) private _mapaModel: Model<Mapa>,
    @InjectConnection() private readonly connection: mongoose.Connection,
    private readonly commonService: CommonService,
  ) {}

  async create(createMapaDto: CreateMapaDto) {
    const session = await this.connection.startSession();
    session.startTransaction();

    try {
      //VALIDAR QUE LOS MAPAS INTERNOS EXISTAN (SI SE PROPORCIONAN)
      if (createMapaDto.mapsInternal && createMapaDto.mapsInternal.length > 0) {
        await this.validateMapsInternal(createMapaDto.mapsInternal);
      }

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
      filter.name = { $regex: name, $options: 'i' };
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
          mapsInternal: 1,
          amountSubmaps: 1,
          statusSubmaps: 1,
          lock: 1,
          createdAt: 1,
          updatedAt: 1,
          ubersmithTicketId: 1,
        },
      },
    ]);

    return result;
  }

  async findById(id: string) {
    const mapa = await this._mapaModel.findOne({
      _id: id,
      isActive: true,
    });

    if (!mapa) throw new NotFoundException(`Mapa with id ${id} not found`);

    return mapa;
  }

  /**
   * @description Obtiene el status de los dispositivos del mapa
   * @param id - id del mapa
   * @returns Promise<string> - STATUS.UP o STATUS.DOWN
   */
  async getMapaStatusDevicesIcmp(uuid: string) {
    const result = await this._mapaModel.aggregate([
      {
        $match: {
          _id: new mongoose.Types.ObjectId(uuid),
          isActive: true,
        },
      },
      {
        $lookup: {
          from: 'devices',
          localField: 'Devices',
          foreignField: '_id',
          pipeline: [
            {
              $project: {
                StatusIcmp: 1,
              },
            },
          ],
          as: 'listDevices',
        },
      },
      {
        $addFields: {
          statusDevicesIcmp: {
            up: {
              $size: {
                $filter: {
                  input: '$listDevices',
                  as: 'device',
                  cond: { $eq: ['$$device.StatusIcmp', 'up'] },
                },
              },
            },
            down: {
              $size: {
                $filter: {
                  input: '$listDevices',
                  as: 'device',
                  cond: { $eq: ['$$device.StatusIcmp', 'down'] },
                },
              },
            },
            verified: {
              $size: {
                $filter: {
                  input: '$listDevices',
                  as: 'device',
                  cond: { $eq: ['$$device.StatusIcmp', 'verified'] },
                },
              },
            },
            unknown: {
              $size: {
                $filter: {
                  input: '$listDevices',
                  as: 'device',
                  cond: { $eq: ['$$device.StatusIcmp', 'unknown'] },
                },
              },
            },
          },
        },
      },
      {
        $unset: ['listDevices'],
      },
      {
        $project: {
          _id: 1,
          name: 1,
          Devices: 1,
          StatusDevices: 1,
          statusDevicesIcmp: 1,
        },
      },
    ]);

    //SI NO EXISTE EL MAPA, LANZAR UN ERROR
    if (!result || result.length === 0) {
      //throw new NotFoundException(`Mapa with id ${id} not found`);
      this.logger.warn(`Mapa with id ${uuid} not found`);
      return STATUS.DOWN;
    }

    this.logger.debug(
      `GET MAPA STATUS DEVICES ICMP: ${JSON.stringify(result)}`,
    );
    //VERIFICAR SI EL MAPA TIENE ALGUN DEVICE CON STATUS DOWN
    if (result[0].statusDevicesIcmp.down > 0) {
      return STATUS.DOWN;
    }

    //SI NO TIENE ALGUN DEVICE CON STATUS DOWN, RETORNAR STATUS UP
    return STATUS.UP;
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
            'DeviceOrigen InterfaceOrigen DevicesInterfacesDestination tipoMedio idsnmp lastStatus isActive sourceHandle targetHandle waypoints',
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
    await this.findById(id);

    try {
      //VALIDAR QUE LOS MAPAS INTERNOS EXISTAN (SI SE PROPORCIONAN)
      if (updateMapaDto.mapsInternal && updateMapaDto.mapsInternal.length > 0) {
        await this.validateMapsInternal(updateMapaDto.mapsInternal);
      }

      //SI mapsInternal VIENE EN EL UPDATE, CALCULAR amountSubmaps
      const updateData: any = { ...updateMapaDto };
      if (updateMapaDto.mapsInternal) {
        updateData['amountSubmaps'] = updateMapaDto.mapsInternal?.length || 0;
      }
      //SI VIENE ubersmithTicketId, CAMBIAR EL STATUS A VERIFIED
      if (updateMapaDto.ubersmithTicketId) {
        updateData['StatusDevices'] = STATUS.VERIFIED;
      }
      //CONSTRUIR LA OPERACIÓN DE ACTUALIZACIÓN
      const updateOperation: any = { $set: updateData };

      //SI VIENE ubersmithTicketId, AGREGARLO AL ARREGLO listTicketsUbersmith SIN DUPLICADOS
      if (updateMapaDto.ubersmithTicketId) {
        updateOperation.$addToSet = {
          listTicketsUbersmith: updateMapaDto.ubersmithTicketId,
        };
      }

      //ACTUALIZAR EL MAPA
      const updatedMapa = await this._mapaModel.findOneAndUpdate(
        { _id: id },
        updateOperation,
        { new: true },
      );

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

  /**
   * @description Validar que los mapas internos existan
   * @param mapsInternalIds: string[] - Array de IDs de mapas internos
   * @throws BadRequestException - Si alguno de los mapas internos no existe o no está activo
   * @returns void - Si todos los mapas internos existen y están activos
   */
  async validateMapsInternal(mapsInternalIds: string[]): Promise<void> {
    //VALIDAR QUE LOS MAPAS INTERNOS EXISTAN
    const mapas = await this._mapaModel.find({
      _id: { $in: mapsInternalIds },
      isActive: true,
    });

    //ENCONTRAR LOS IDs QUE NO EXISTEN
    const foundIds = mapas.map((mapa) => mapa._id.toString());
    const missingIds = mapsInternalIds.filter((id) => !foundIds.includes(id));

    //VERIFICAR QUE TODOS LOS IDs EXISTAN
    if (mapas.length !== mapsInternalIds.length) {
      throw new BadRequestException(
        `The following map IDs do not exist or are not active: ${missingIds.join(', ')}`,
      );
    }
  }
}
