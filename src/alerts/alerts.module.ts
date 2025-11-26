import { Module } from '@nestjs/common';
import { AlertsService } from './alerts.service';
import { AlertsController } from './alerts.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { Alert, AlertSchema } from './entities/alert.entity';
import { CommonModule } from 'src/common/common.module';
import { Device, DeviceSchema } from 'src/devices/entities/device.entity';
import {
  EventLog,
  EventLogSchema,
} from 'src/event-logs/entities/event-log.entity';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Alert.name, schema: AlertSchema },
      { name: Device.name, schema: DeviceSchema },
    ]),
    MongooseModule.forFeature([
      { name: EventLog.name, schema: EventLogSchema },
    ]),
    CommonModule,
  ],
  controllers: [AlertsController],
  providers: [AlertsService],
  exports: [AlertsService],
})
export class AlertsModule {}
