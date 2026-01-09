import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ClasificationsService } from './clasifications.service';
import { ClasificationsController } from './clasifications.controller';
import {
  Clasification,
  ClasificationSchema,
} from './entities/clasification.entity';
import { CommonModule } from 'src/common/common.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Clasification.name, schema: ClasificationSchema },
    ]),
    CommonModule,
  ],
  controllers: [ClasificationsController],
  providers: [ClasificationsService],
  exports: [ClasificationsService, MongooseModule],
})
export class ClasificationsModule {}
