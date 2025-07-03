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
import { EventLog } from 'src/event-logs/entities/event-log.entity';
import { EventEmitter2, OnEvent } from '@nestjs/event-emitter';
import { STATUS } from 'src/common/enums/status.enum';
import { EVENT_LOGS } from 'src/common/enums/event-logs.enum.ts';

@Injectable()
export class DevicesService {
  constructor(
    @InjectModel(Device.name) private _deviceModel: Model<Device>,
    @InjectModel(Mapa.name) private _mapaModel: Model<Mapa>,
    @InjectModel(EventLog.name) private _eventLogModel: Model<EventLog>,
    @InjectConnection() private readonly connection: mongoose.Connection,
    private readonly commonService: CommonService,
    private readonly mapasService: MapasService,
    private eventEmitter: EventEmitter2,
  ) {}

  @OnEvent(EVENT_LOGS.DEVICE_STATUS_ICMP_CHANGED)
  async handledeviceStatusIcmpChangedEvent(payload: any) {
    const { _id, StatusIcmp, lastChangeStatusTime } = payload;

    //BUSCAR EL ÚLTIMO LOG REGISTRADO PARA EL DISPOSITIVO ESPECÍFICO,
    //ORDENANDO POR LA FECHA DE CAMBIO DE ESTADO (changedAt) DE FORMA DESCENDENTE
    const lastLog = await this._eventLogModel
      .findOne({ deviceId: _id })
      .sort({ changedAt: -1 })
      .lean();

    //SI EL ESTADO NO HA CAMBIADO, NO SE REGISTRA NINGÚN LOG
    if (lastLog && lastLog.StatusIcmp === StatusIcmp) {
      return;
    }

    let elapsedFormatted = '00:00:00.000';
    let StatusTransition: {
      from: string;
      to: string;
      message?: string;
    } | null = null;

    if (lastLog?.changedAt) {
      const elapsedMs =
        new Date(lastChangeStatusTime).getTime() -
        new Date(lastLog.changedAt).getTime();

      console.log(lastChangeStatusTime, '-', lastLog.changedAt);

      const hours = Math.floor(elapsedMs / 3600000);
      const minutes = Math.floor((elapsedMs % 3600000) / 60000);
      const seconds = Math.floor((elapsedMs % 60000) / 1000);
      const milliseconds = elapsedMs % 1000;

      elapsedFormatted =
        `${hours.toString().padStart(2, '0')}:` +
        `${minutes.toString().padStart(2, '0')}:` +
        `${seconds.toString().padStart(2, '0')}.` +
        `${milliseconds.toString().padStart(3, '0')}`;

      StatusTransition = {
        from: lastLog.StatusIcmp,
        to: StatusIcmp,
        message: `Status change from ${lastLog.StatusIcmp} to ${StatusIcmp}`,
      };
    }

    await this._eventLogModel.create({
      deviceId: _id,
      StatusIcmp,
      changedAt: lastChangeStatusTime,
      Time: elapsedFormatted,
      StatusTransition,
    });
  }

  async create(createDeviceDto: CreateDeviceDto) {
    const session = await this.connection.startSession();
    session.startTransaction();

    try {
      //BUSCAR SI EXISTE UN DISPOSITIVO DESACTIVADO CON EL MISMO IP
      const foundDeviceDesactivated = await this._deviceModel.findOne({
        isActive: false,
        ip: createDeviceDto.ip,
      });

      if (foundDeviceDesactivated) {
        const prevStatusIcmp = foundDeviceDesactivated.StatusIcmp;
        const newStatusIcmp = createDeviceDto.StatusIcmp;

        const deviceRecreatedPayload: any = {
          isActive: true,
          ...createDeviceDto,
        };

        const now = Date.now();

        //SOLO ACTUALIZA EL TIMESTAMP SI EL ESTADO CAMBIO
        if (prevStatusIcmp !== newStatusIcmp) {
          const now = new Date();
          deviceRecreatedPayload.lastChangeStatusTime = now;
        }

        //REACTIVAR EL DISPOSITIVO Y ACTUALIZAR SUS CAMPOS
        await foundDeviceDesactivated.updateOne(deviceRecreatedPayload, {
          session,
        });

        //ACTUALIZAR LOS MAPAS RELACIONADOS
        for (const mapUUID of createDeviceDto.MapUUID) {
          const mapa = await this.mapasService.findById(mapUUID);
          await mapa.updateOne(
            {
              $inc: { AmountDevices: 1 },
              $push: { Devices: foundDeviceDesactivated._id },
            },
            { session },
          );
        }
        //CONFIRMANDO LA TRANSACCION
        await session.commitTransaction();

        //RETORNAMOS EL DEVICE ACTUALIZADO
        const deviceRecreated = await this._deviceModel.findById(
          foundDeviceDesactivated._id,
        );

        //EMITIR EVENTLOGS DESPUES DE REACTIVAR EL DEVICE SOLO SI EL ESTADO CAMBIO
        //NO EMITIR NI CREES UN LOG SI EL ESTADO ANTERIOR Y EL NUEVO SON IGUALES
        if (prevStatusIcmp !== newStatusIcmp) {
          this.eventEmitter.emit(EVENT_LOGS.DEVICE_STATUS_ICMP_CHANGED, {
            _id: deviceRecreated?._id,
            StatusIcmp: deviceRecreated?.StatusIcmp,
            lastChangeStatusTime: deviceRecreated?.lastChangeStatusTime,
          });
        }

        return deviceRecreated;
      }

      //SI NO EXISTE, CREAR NORMALMENTE
      const device = await this._deviceModel.create([createDeviceDto], {
        session,
      });

      //ITERAR SOBRE EL ARREGLO de MapUUID
      for (const mapUUID of createDeviceDto.MapUUID) {
        const mapa = await this.mapasService.findById(mapUUID);

        //ACTUALIZANDO EL CAMPO DE DEVICES EN CADA MAPA
        await mapa
          .updateOne({
            $inc: { AmountDevices: 1 },
            $push: { Devices: device[0]._id },
          })
          .session(session);
      }

      //CONFIRMANDO LA TRANSACCION
      await session.commitTransaction();

      //EMITIR EVENTO DESPUÉS DE CREAR EL DEVICE
      this.eventEmitter.emit(EVENT_LOGS.DEVICE_STATUS_ICMP_CHANGED, {
        _id: device[0]._id,
        StatusIcmp: device[0].StatusIcmp,
        lastChangeStatusTime: device[0].lastChangeStatusTime,
      });

      //RETORNAMOS EL DEVICE CREADO OBJETO [0]
      return device[0];
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
      const devicePayload = {
        ...updateDeviceDto,
      };

      const device = await this.findById(id);

      //BANDERA PARA SABER SI SE CAMBIO EL STATUSICMP
      let statusIcmpChanged = false;

      //SI CAMBIA EL STATUSICMP, ACTUALIZA EL TIMESTAMP
      if (
        updateDeviceDto.StatusIcmp &&
        updateDeviceDto.StatusIcmp !== device.StatusIcmp
      ) {
        devicePayload['lastChangeStatusTime'] = Date.now();
        statusIcmpChanged = true;
      }

      //SI SE PASA EL CAMPO MapUUID
      if (updateDeviceDto.MapUUID) {
        //ITERAR SOBRE EL ARREGLO DE MapUUID
        for (const mapUUID of device.MapUUID) {
          const mapa = await this._mapaModel.findById(mapUUID);

          //ACTUALIZANDO EL MAPA PARA REMOVER EL DEVICE
          if (mapa)
            await mapa
              .updateOne({
                $inc: { AmountDevices: -1 },
                $pull: { Devices: device._id }, //VERIFICA DEVICE EXISTA EN ARREGLO, SI NO EXISTE NO DISMINUYA EL CONTADOR AmountDevices
              })
              .session(session);
        }

        //ACTUALIZAR EL CAMPO DE MapUUIDs EN EL DISPOSITIVO
        device.MapUUID = updateDeviceDto.MapUUID.map(
          (id) => new mongoose.Types.ObjectId(id),
        );

        //ITERAR SOBRE EL NUEVO ARREGLO DE MapUUID
        for (const mapUUID of updateDeviceDto.MapUUID) {
          const mapa = await this.mapasService.findById(mapUUID.toString());

          //ACTUALIZANDO EL CAMPO DE DEVICES EN CADA MAPA
          await mapa
            .updateOne({
              $inc: { AmountDevices: 1 },
              $push: { Devices: device._id },
            })
            .session(session);
        }
      }

      //ACTUALIZAR EL DISPOSITIVO
      const updatedDevice = await device
        .updateOne(devicePayload)
        .session(session);

      //CONFIRMANDO LA TRANSACCION
      await session.commitTransaction();

      //EMITIR EVENTO SOLO SI CAMBIO StatusIcmp
      if (statusIcmpChanged) {
        //OBTENER EL DEVICE ACTUALIZADO
        const updatedDevice = await this._deviceModel.findById(device._id);

        this.eventEmitter.emit(EVENT_LOGS.DEVICE_STATUS_ICMP_CHANGED, {
          _id: updatedDevice?._id,
          StatusIcmp: updatedDevice?.StatusIcmp,
          lastChangeStatusTime: updatedDevice?.lastChangeStatusTime,
        });
      }

      return updatedDevice;
    } catch (error) {
      this.commonService.handleExceptions(error);
      //ABORTANDO TODOS LOS CAMBIOS A BASE DE DATOS
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

      //SOLO EMITIR EVENTLOGS SI EL DISPOSITIVO ESTÁ ACTUALMENTE "up"
      const shouldEmitEventLogs = device.StatusIcmp === STATUS.UP;

      //ITERAR SOBRE EL ARREGLO DE MapUUID
      for (const mapUUID of device.MapUUID) {
        const mapa = await this._mapaModel.findById(mapUUID);

        //ACTUALIZANDO EL MAPA PARA REMOVER EL DEVICE
        if (mapa)
          await mapa
            .updateOne({
              $inc: { AmountDevices: -1 },
              $pull: { Devices: device._id }, //VERIFICA DEVICE EXISTA EN ARREGLO, SI NO EXISTE NO DISMINUYA EL CONTADOR AmountDevices
            })
            .session(session);
      }

      const updatePayload: any = {
        isActive: false,
        StatusIcmp: STATUS.DOWN,
      };

      //SOLO ACTUALIZA EL TIMESTAMP SI EL ESTADO ERA "up"
      if (device.StatusIcmp === STATUS.UP) {
        updatePayload.lastChangeStatusTime = Date.now();
      }

      //ELIMINADO EL DEVICE ENCONTRADO
      await device.updateOne(updatePayload).session(session);

      //CONFIRMANDO LA TRANSACCION
      await session.commitTransaction();

      //EMITIR EVENTLOGS SOLO SI EL DISPOSITIVO ESTABA EN "up" ANTES DE ELIMINARLO
      if (shouldEmitEventLogs) {
        //OBTENER EL DEVICE ELIMINADO
        const removeDevice = await this._deviceModel.findById(device._id);

        this.eventEmitter.emit(EVENT_LOGS.DEVICE_STATUS_ICMP_CHANGED, {
          _id: removeDevice?._id,
          StatusIcmp: removeDevice?.StatusIcmp,
          lastChangeStatusTime: removeDevice?.lastChangeStatusTime,
        });
      }

      return `Device ${device.name} Delete!`;
    } catch (error) {
      this.commonService.handleExceptions(error);
      //BORTANDO TODOS LOS CAMBIOS A BASE DE DATOS
      session.abortTransaction();
    } finally {
      await session.endSession();
    }
  }
}
