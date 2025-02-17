import { Module } from '@nestjs/common';
import { EnlacesService } from './enlaces.service';
import { EnlacesController } from './enlaces.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { Enlace, EnlaceSchema } from './entities/enlace.entity';
import { CommonModule } from 'src/common/common.module';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Enlace.name, schema: EnlaceSchema }]),
    CommonModule,
  ],
  controllers: [EnlacesController],
  providers: [EnlacesService],
})
export class EnlacesModule {}
