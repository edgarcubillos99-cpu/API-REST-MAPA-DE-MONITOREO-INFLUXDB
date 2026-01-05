import { Module } from '@nestjs/common';
import { DevicesService } from './devices.service';
import { DevicesController } from './devices.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { Device, DeviceSchema } from './entities/device.entity';
import { CommonModule } from 'src/common/common.module';
import { MapasModule } from 'src/mapas/mapas.module';
import { Mapa, MapaSchema } from 'src/mapas/entities/mapa.entity';
import {
  EventLog,
  EventLogSchema,
} from 'src/event-logs/entities/event-log.entity';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Device.name, schema: DeviceSchema }]),
    MongooseModule.forFeature([{ name: Mapa.name, schema: MapaSchema }]),
    MongooseModule.forFeature([
      { name: EventLog.name, schema: EventLogSchema },
    ]),
    CommonModule,
    MapasModule,
  ],
  controllers: [DevicesController],
  providers: [DevicesService],
})
export class DevicesModule {}
