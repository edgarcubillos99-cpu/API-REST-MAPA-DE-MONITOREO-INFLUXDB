import { Module } from '@nestjs/common';
import { DevicesService } from './devices.service';
import { DevicesController } from './devices.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { Device, DeviceSchema } from './entities/device.entity';
import { CommonModule } from 'src/common/common.module';
import { MapasModule } from 'src/mapas/mapas.module';
import { Mapa, MapaSchema } from 'src/mapas/entities/mapa.entity';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Device.name, schema: DeviceSchema }]),
    MongooseModule.forFeature([{ name: Mapa.name, schema: MapaSchema }]),
    CommonModule,
    MapasModule,
  ],
  controllers: [DevicesController],
  providers: [DevicesService],
})
export class DevicesModule {}
