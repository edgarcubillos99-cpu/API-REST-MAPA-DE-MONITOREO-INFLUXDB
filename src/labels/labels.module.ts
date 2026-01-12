import { Module } from '@nestjs/common';
import { LabelsService } from './labels.service';
import { LabelsController } from './labels.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { Label, LabelSchema } from './entities/label.entity';
import { Mapa, MapaSchema } from 'src/mapas/entities/mapa.entity';
import { CommonModule } from 'src/common/common.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Label.name, schema: LabelSchema },
      { name: Mapa.name, schema: MapaSchema },
    ]),
    CommonModule,
  ],
  controllers: [LabelsController],
  providers: [LabelsService],
})
export class LabelsModule {}
