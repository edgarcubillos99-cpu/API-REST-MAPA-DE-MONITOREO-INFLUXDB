import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { UbersmithService } from './ubersmith.service';
import { UbersmithController } from './ubersmith.controller';

@Module({
  imports: [HttpModule],
  controllers: [UbersmithController],
  providers: [UbersmithService],
  exports: [UbersmithService],
})
export class UbersmithModule {}
