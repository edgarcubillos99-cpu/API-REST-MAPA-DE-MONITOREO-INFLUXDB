import { Module } from '@nestjs/common';
import { UbersmithService } from './ubersmith.service';
import { UbersmithController } from './ubersmith.controller';

@Module({
  controllers: [UbersmithController],
  providers: [UbersmithService],
})
export class UbersmithModule {}
