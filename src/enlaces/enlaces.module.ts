import { Module } from '@nestjs/common';
import { EnlacesService } from './enlaces.service';
import { EnlacesController } from './enlaces.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { Enlace, EnlaceSchema } from './entities/enlace.entity';
import { CommonModule } from 'src/common/common.module';
import {
  DestinationEnlace,
  DestinationEnlaceSchema,
} from './entities/destination-enlace.entity';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Enlace.name, schema: EnlaceSchema }]),
    MongooseModule.forFeature([
      { name: DestinationEnlace.name, schema: DestinationEnlaceSchema },
    ]),
    CommonModule,
  ],
  controllers: [EnlacesController],
  providers: [EnlacesService],
})
export class EnlacesModule {}
