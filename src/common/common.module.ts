import { Module } from '@nestjs/common';
import { CommonService } from './common.service';
import { RabbitmqService } from './rabbitmq.service';

@Module({
  imports: [],
  providers: [CommonService, RabbitmqService],
  exports: [CommonService, RabbitmqService],
})
export class CommonModule {}
