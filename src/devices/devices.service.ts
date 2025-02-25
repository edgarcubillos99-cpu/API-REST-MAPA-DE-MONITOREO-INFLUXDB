import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateDeviceDto } from './dto/create-device.dto';
import { UpdateDeviceDto } from './dto/update-device.dto';
import { InjectConnection, InjectModel } from '@nestjs/mongoose';
import { Device } from './entities/device.entity';
import mongoose, { Model } from 'mongoose';
import { CommonService } from 'src/common/common.service';
import { PaginationDto } from 'src/common/dto/pagination.dto';
import { MapasService } from 'src/mapas/mapas.service';
import { Mapa } from 'src/mapas/entities/mapa.entity';

@Injectable()
export class DevicesService {
  constructor(
    @InjectModel(Device.name) private _deviceModel: Model<Device>,
    @InjectModel(Mapa.name) private _mapaModel: Model<Mapa>,
    @InjectConnection() private readonly connection: mongoose.Connection,
    private readonly commonService: CommonService,
    private readonly mapasService: MapasService,
  ) {}

  async create(createDeviceDto: CreateDeviceDto) {
    const session = await this.connection.startSession();
    session.startTransaction();

    try {
      const device = await this._deviceModel.create([createDeviceDto], {
        session,
      });

      // ITERAR SOBRE EL ARREGLO de MapUUID
      for (const mapUUID of createDeviceDto.MapUUID) {
        const mapa = await this.mapasService.findById(mapUUID);

        // ACTUALIZANDO EL CAMPO DE DEVICES EN CADA MAPA
        await mapa
          .updateOne({
            $inc: { AmountDevices: 1 },
            $push: { Devices: device[0]._id },
          })
          .session(session);
      }

      // CONFIRMANDO LA TRANSACCION
      await session.commitTransaction();

      return device;
    } catch (error) {
      this.commonService.handleExceptions(error);
      // ABORTANDO TODOS LOS CAMBIOS A BASE DE DATOS
      session.abortTransaction();
    } finally {
      await session.endSession();
    }
  }

  async findAll(paginationDto: PaginationDto) {
    const { limit = 10, offset = 0, name } = paginationDto;
    let result: any;

    if (name) {
      result = await this._deviceModel
        .find({
          isActive: true,
          $or: [{ name: { $regex: `^${name}`, $options: 'i' } }],
        })
        .skip(offset)
        .limit(limit)
        .exec();

      return result;
    }

    result = await this._deviceModel
      .find({ isActive: true })
      .skip(offset)
      .limit(limit)
      .exec();

    return result;
  }

  async findById(id: string) {
    const device = await this._deviceModel
      .findOne({
        _id: id,
        isActive: true,
      })
      .exec();

    if (!device) throw new NotFoundException(`Device with id ${id} not found`);

    return device;
  }

  async update(id: string, updateDeviceDto: UpdateDeviceDto) {
    const session = await this.connection.startSession();
    session.startTransaction();

    try {
      const device = await this.findById(id);

      // SI SE PASA EL CAMPO MapUUID
      if (updateDeviceDto.MapUUID) {
        // ITERAR SOBRE EL ARREGLO DE MapUUID
        for (const mapUUID of device.MapUUID) {
          const mapa = await this.mapasService.findById(mapUUID.toString());

          // ACTUALIZANDO EL MAPA PARA REMOVER EL DEVICE
          await mapa
            .updateOne({
              $inc: { AmountDevices: -1 },
              $pull: { Devices: device._id }, // VERIFICA DEVICE EXISTA EN ARREGLO, SI NO EXISTE NO DISMINUYA EL CONTADOR AmountDevices
            })
            .session(session);
        }

        // ACTUALIZAR EL CAMPO DE MapUUIDs EN EL DISPOSITIVO
        device.MapUUID = updateDeviceDto.MapUUID.map(
          (id) => new mongoose.Types.ObjectId(id),
        );

        // ITERAR SOBRE EL NUEVO ARREGLO DE MapUUID
        for (const mapUUID of updateDeviceDto.MapUUID) {
          const mapa = await this.mapasService.findById(mapUUID.toString());

          // ACTUALIZANDO EL CAMPO DE DEVICES EN CADA MAPA
          await mapa
            .updateOne({
              $inc: { AmountDevices: 1 },
              $push: { Devices: device._id },
            })
            .session(session);
        }
      }

      // ACTUALIZAR EL DISPOSITIVO
      const updatedDevice = await device
        .updateOne(updateDeviceDto)
        .session(session);

      // CONFIRMANDO LA TRANSACCION
      await session.commitTransaction();

      return updatedDevice;
    } catch (error) {
      this.commonService.handleExceptions(error);
      // ABORTANDO TODOS LOS CAMBIOS A BASE DE DATOS
      await session.abortTransaction();
    } finally {
      await session.endSession();
    }
  }

  async remove(id: string) {
    const session = await this.connection.startSession();
    session.startTransaction();

    try {
      const device = await this.findById(id);

      // ITERAR SOBRE EL ARREGLO DE MapUUID
      for (const mapUUID of device.MapUUID) {
        const mapa = await this.mapasService.findById(mapUUID.toString());

        // ACTUALIZANDO EL MAPA PARA REMOVER EL DEVICE
        await mapa
          .updateOne({
            $inc: { AmountDevices: -1 },
            $pull: { Devices: device._id }, // VERIFICA DEVICE EXISTA EN ARREGLO, SI NO EXISTE NO DISMINUYA EL CONTADOR AmountDevices
          })
          .session(session);
      }

      // ELIMINADO EL DEVICE ENCONTRADO
      await device.updateOne({ isActive: false }).session(session);

      // CONFIRMANDO LA TRANSACCION
      await session.commitTransaction();

      return `Device ${device.name} Delete!`;
    } catch (error) {
      this.commonService.handleExceptions(error);
      // ABORTANDO TODOS LOS CAMBIOS A BASE DE DATOS
      session.abortTransaction();
    } finally {
      await session.endSession();
    }
  }
}
