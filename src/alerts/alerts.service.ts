import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CreateAlertDto } from './dto/create-alert.dto';
import { UpdateAlertDto } from './dto/update-alert.dto';
import { Alert } from './entities/alert.entity';
import { Model } from 'mongoose';
import { InjectModel } from '@nestjs/mongoose';
import { CommonService } from 'src/common/common.service';
import { Device } from 'src/devices/entities/device.entity';
import { AlertsPaginationDto } from './dto/alerts-pagination.dto';
import { EventEmitter2, OnEvent } from '@nestjs/event-emitter';
import { EventLog } from 'src/event-logs/entities/event-log.entity';
import { EVENT_LOGS } from 'src/common/enums/event-logs.enum';
import { EVENT_LOGS_TYPE } from 'src/event-logs/enums/event-logs-type.enum';
import { Channel } from 'src/channels/entities/channel.entity';

@Injectable()
export class AlertsService {
  constructor(
    @InjectModel(Alert.name) private _alertsModel: Model<Alert>,
    @InjectModel(Device.name) private _deviceModel: Model<Device>,
    @InjectModel(Channel.name) private _channelModel: Model<Channel>,
    @InjectModel(EventLog.name) private _eventLogModel: Model<EventLog>,
    private readonly commonService: CommonService,
    private eventEmitter: EventEmitter2,
  ) {}

  @OnEvent(EVENT_LOGS.ALERT_IS_ACTIVE_CHANGED)
  async handleAlertIsActiveChangedEvent(payload: any) {
    const { _id, isActiveAlert, lastChangeStatusTime, devices } = payload;

    //BUSCAR EL ÚLTIMO LOG REGISTRADO PARA LA ALERTA ESPECÍFICA,
    //ORDENANDO POR LA FECHA DE CAMBIO DE ESTADO (changedAt) DE FORMA DESCENDENTE
    //FILTRAR POR alert Y logType ALERT
    const lastLog = await this._eventLogModel
      .findOne({
        alert: _id,
        logType: EVENT_LOGS_TYPE.ALERT,
      })
      .sort({ changedAt: -1 })
      .lean();

    //CONVERTIR isActiveAlert A STRING "up" O "down" PARA COMPARAR CON EL Status DEL LOG
    const statusString = isActiveAlert ? 'up' : 'down';

    //SI EL ESTADO NO HA CAMBIADO, NO SE REGISTRA NINGÚN LOG
    if (lastLog && lastLog.Status === statusString) {
      return;
    }

    let elapsedFormatted = '00:00:00.000';
    let StatusTransition: {
      from: string;
      to: string;
    } | null = null;

    if (lastLog?.changedAt) {
      const elapsedMs =
        new Date(lastChangeStatusTime).getTime() -
        new Date(lastLog.changedAt).getTime();

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
        from: lastLog.Status,
        to: statusString,
      };
    }

    await this._eventLogModel.create({
      devices: devices,
      Status: statusString,
      changedAt: lastChangeStatusTime,
      Time: elapsedFormatted,
      StatusTransition,
      logType: EVENT_LOGS_TYPE.ALERT,
      alert: _id,
      message: StatusTransition
        ? `Cantidad de tiempo ${StatusTransition?.from} ${elapsedFormatted}`
        : null,
    });
  }

  async create(createAlertDto: CreateAlertDto) {
    try {
      //VALIDAR QUE LOS DISPOSITIVOS EXISTAN
      await this.validateDevices(createAlertDto.devices);

      //VALIDAR QUE LOS CANALES EXISTAN (SI SE ENVÍAN)
      if (createAlertDto.channels && createAlertDto.channels.length > 0) {
        await this.validateChannels(createAlertDto.channels);
      }

      //CREAR LA ALERTA
      const alert = await this._alertsModel.create(createAlertDto);

      //EMITIR EVENTO LOG PARA LA ALERTA CREADA
      this.eventEmitter.emit(EVENT_LOGS.ALERT_IS_ACTIVE_CHANGED, {
        _id: alert._id,
        isActiveAlert: alert.isActiveAlert,
        lastChangeStatusTime: new Date(),
        devices: alert.devices,
      });

      //RETORNAR LA ALERTA CREADA
      return alert;
    } catch (error) {
      this.commonService.handleExceptions(error);
    }
  }

  async findAll(alertsPaginationDto: AlertsPaginationDto) {
    const {
      limit = 10,
      offset = 0,
      description,
      oid,
      operator,
    } = alertsPaginationDto;

    //FILTRO PARA LA BÚSQUEDAS
    const filter = {
      ...(description && {
        description: { $regex: description, $options: 'i' },
      }),
      ...(oid && { oid }),
      ...(operator && { operator: { $regex: operator, $options: 'i' } }),
    };

    try {
      const alerts = await this._alertsModel
        .find(filter)
        .populate('devices', '_id ip make name')
        .skip(offset)
        .limit(limit);

      return alerts;
    } catch (error) {
      this.commonService.handleExceptions(error);
    }
  }

  async findById(id: string) {
    try {
      const alert = await this._alertsModel
        .findById(id)
        .populate('devices', '_id ip make name')
        .populate('channels', '_id name description url');

      if (!alert) {
        throw new NotFoundException(`Alert with id ${id} not found`);
      }

      return alert;
    } catch (error) {
      this.commonService.handleExceptions(error);
    }
  }

  async update(id: string, updateAlertDto: UpdateAlertDto) {
    try {
      //VALIDAR QUE LA ALERTA EXISTA
      const currentAlert = await this.findById(id);

      //VALIDAR QUE LOS DISPOSITIVOS EXISTAN (SI SE ENVÍAN)
      if (updateAlertDto.devices && updateAlertDto.devices.length > 0) {
        await this.validateDevices(updateAlertDto.devices);
      }

      //VALIDAR QUE LOS CANALES EXISTAN (SI SE ENVÍAN)
      if (updateAlertDto.channels && updateAlertDto.channels.length > 0) {
        await this.validateChannels(updateAlertDto.channels);
      }

      //ACTUALIZAR LA ALERTA
      const updatedAlert = await this._alertsModel.findByIdAndUpdate(
        id,
        updateAlertDto,
        { new: true },
      );

      //EMITIR EVENTO LOG SI isActiveAlert HA CAMBIADO
      if (
        updateAlertDto.isActiveAlert !== undefined &&
        currentAlert?.isActiveAlert !== updatedAlert?.isActiveAlert
      ) {
        this.eventEmitter.emit(EVENT_LOGS.ALERT_IS_ACTIVE_CHANGED, {
          _id: updatedAlert?._id,
          isActiveAlert: updatedAlert?.isActiveAlert,
          lastChangeStatusTime: new Date(),
          devices: updatedAlert?.devices,
        });
      }

      //RETORNAR LA ALERTA ACTUALIZADA
      return updatedAlert;
    } catch (error) {
      this.commonService.handleExceptions(error);
    }
  }

  async remove(id: string) {
    try {
      //VALIDAR QUE LA ALERTA EXISTA
      await this.findById(id);

      //ELIMINAR LA ALERTA
      await this._alertsModel.findByIdAndDelete(id);

      return 'Alert deleted!';
    } catch (error) {
      this.commonService.handleExceptions(error);
    }
  }

  /**
   * @description validar que los dispositivos existan
   * @param deviceIds: string[] - Array de IDs de dispositivos
   * @throws BadRequestException - Si alguno de los dispositivos no existe o no está activo
   * @returns void - Si todos los dispositivos existen y están activos
   */
  async validateDevices(deviceIds: string[]): Promise<void> {
    //VALIDAR QUE LOS DISPOSITIVOS EXISTAN
    const devices = await this._deviceModel.find({
      _id: { $in: deviceIds },
      isActive: true,
    });

    //ENCONTRAR LOS IDs QUE NO EXISTEN
    const foundIds = devices.map((device) => device._id.toString());
    const missingIds = deviceIds.filter((id) => !foundIds.includes(id));

    //VERIFICAR QUE TODOS LOS IDs EXISTAN
    if (devices.length !== deviceIds.length) {
      throw new BadRequestException(
        `The following device IDs do not exist or are not active: ${missingIds.join(', ')}`,
      );
    }
  }

  /**
   * @description validar que los canales existan
   * @param channelIds: string[] - Array de IDs de canales
   * @throws BadRequestException - Si alguno de los canales no existe
   * @returns void - Si todos los canales existen
   */
  async validateChannels(channelIds: string[]): Promise<void> {
    //VALIDAR QUE LOS CANALES EXISTAN
    const channels = await this._channelModel.find({
      _id: { $in: channelIds },
    });

    //ENCONTRAR LOS IDs QUE NO EXISTEN
    const foundIds = channels.map((channel) => channel._id.toString());
    const missingIds = channelIds.filter((id) => !foundIds.includes(id));

    //VERIFICAR QUE TODOS LOS IDs EXISTAN
    if (channels.length !== channelIds.length) {
      throw new BadRequestException(
        `The following channel IDs do not exist: ${missingIds.join(', ')}`,
      );
    }
  }
}
