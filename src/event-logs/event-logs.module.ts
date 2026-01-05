import { Module } from '@nestjs/common';
import { EventLogsService } from './event-logs.service';
import { EventLogsController } from './event-logs.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { EventLog, EventLogSchema } from './entities/event-log.entity';
import { CommonModule } from 'src/common/common.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: EventLog.name, schema: EventLogSchema },
    ]),
    CommonModule,
  ],
  controllers: [EventLogsController],
  providers: [EventLogsService],
})
export class EventLogsModule {}
