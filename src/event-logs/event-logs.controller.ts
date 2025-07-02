import { Controller, Get, Param } from '@nestjs/common';
import { EventLogsService } from './event-logs.service';
import { ParsemongoidPipe } from 'src/common/pipes/parse-mongoid.pipe';
import { Public } from 'src/common/decorator/public.decorator';
import { ApiTags } from '@nestjs/swagger';
import { AuthSwagger } from 'src/common/decorator/auth-swagger.decorator';

@ApiTags('event-logs')
@Controller('event-logs')
export class EventLogsController {
  constructor(private readonly eventLogsService: EventLogsService) {}

  @Get()
  @AuthSwagger()
  findAll() {
    return this.eventLogsService.findAll();
  }

  @Get(':deviceId')
  @AuthSwagger()
  findByDeviceId(@Param('deviceId', ParsemongoidPipe) deviceId: string) {
    return this.eventLogsService.findByDeviceId(deviceId);
  }
}
