import { Module } from '@nestjs/common';
import { MapasService } from './mapas.service';
import { MapasController } from './mapas.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { Mapa, MapaSchema } from './entities/mapa.entity';
import { CommonModule } from 'src/common/common.module';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Mapa.name, schema: MapaSchema }]),
    CommonModule,
  ],
  controllers: [MapasController],
  providers: [MapasService],
})
export class MapasModule {}
