import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { EventLog } from './entities/event-log.entity';
import { Model } from 'mongoose';
import { EventLogsPaginationDto } from './dto/event-logs-pagination.dto';
import { EVENT_LOGS_TYPE } from './enums/event-logs-type.enum';

@Injectable()
export class EventLogsService {
  constructor(
    @InjectModel(EventLog.name) private _eventLogModel: Model<EventLog>,
  ) {}

  async findAll(eventLogsPaginationDto: EventLogsPaginationDto) {
    const { limit = 10, offset = 0, logType, alert } = eventLogsPaginationDto;

    const filter = {
      ...(logType && { logType: { $regex: logType, $options: 'i' } }),
      ...(alert && { alert: alert }),
    };

    // const eventLogs = await this._eventLogModel
    //   .find()
    //   .populate({
    //     path: 'deviceId',
    //     select: 'ip name StatusIcmp isActive',
    //   })
    //   .exec();

    // const eventLogs = await this._eventLogModel
    //   .find()
    //   .populate({
    //     path: 'deviceId',
    //     select: 'ip name StatusIcmp isActive',
    //   })
    //   .lean()
    //   .exec();

    // //RENOMBRA deviceId a Device Y CONSERVA EL RESTO DE LOS CAMPOS
    // return eventLogs.map(({ deviceId, ...rest }) => ({
    //   Device: deviceId,
    //   ...rest,
    // }));

    const eventLogs = await this._eventLogModel
      .find(filter)
      .skip(offset)
      .limit(limit);

    return eventLogs;
  }

  async findByDeviceId(deviceId: string) {
    // const eventLog = await this._eventLogModel
    //   .find({ deviceId: id })
    //   .populate({
    //     path: 'deviceId',
    //     select: 'ip name StatusIcmp isActive',
    //   })
    //   .exec();

    // return eventLog;

    //BUSCAR EVENTOS DONDE EL ARREGLO devices CONTENGA EL deviceId Y SEAN DE TIPO DEVICE
    const eventLog = await this._eventLogModel.find({
      devices: deviceId,
      logType: EVENT_LOGS_TYPE.DEVICE,
    });

    return eventLog;
  }
}
