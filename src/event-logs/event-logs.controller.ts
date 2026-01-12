import { Controller, Get, Param, Query } from '@nestjs/common';
import { EventLogsService } from './event-logs.service';
import { ParsemongoidPipe } from 'src/common/pipes/parse-mongoid.pipe';
import { ApiTags } from '@nestjs/swagger';
import { AuthSwagger } from 'src/common/decorator/auth-swagger.decorator';
import { PaginationDto } from 'src/common/dto/pagination.dto';
import { EventLogsPaginationDto } from './dto/event-logs-pagination.dto';

@ApiTags('event-logs')
@Controller('event-logs')
export class EventLogsController {
  constructor(private readonly eventLogsService: EventLogsService) {}

  @Get()
  @AuthSwagger()
  findAll(@Query() eventLogsPaginationDto: EventLogsPaginationDto) {
    return this.eventLogsService.findAll(eventLogsPaginationDto);
  }

  @Get(':deviceId')
  @AuthSwagger()
  findByDeviceId(@Param('deviceId', ParsemongoidPipe) deviceId: string) {
    return this.eventLogsService.findByDeviceId(deviceId);
  }
}
