import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { EventLog } from './entities/event-log.entity';
import { Model } from 'mongoose';

@Injectable()
export class EventLogsService {
  constructor(
    @InjectModel(EventLog.name) private _eventLogModel: Model<EventLog>,
  ) {}

  async findAll() {
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

    const eventLogs = await this._eventLogModel.find().exec();

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

    const eventLog = await this._eventLogModel
      .find({ deviceId: deviceId })

      .exec();

    return eventLog;
  }
}
