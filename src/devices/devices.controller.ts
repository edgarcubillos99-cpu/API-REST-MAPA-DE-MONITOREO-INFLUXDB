import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
} from '@nestjs/common';
import { DevicesService } from './devices.service';
import { CreateDeviceDto } from './dto/create-device.dto';
import { UpdateDeviceDto } from './dto/update-device.dto';
import { ApiTags } from '@nestjs/swagger';
import { AuthSwagger } from 'src/common/decorator/auth-swagger.decorator';
import { ParsemongoidPipe } from 'src/common/pipes/parse-mongoid.pipe';
import { PaginationDto } from 'src/common/dto/pagination.dto';

@ApiTags('devices')
@Controller('devices')
export class DevicesController {
  constructor(private readonly devicesService: DevicesService) {}

  @Post()
  @AuthSwagger()
  create(@Body() createDeviceDto: CreateDeviceDto) {
    return this.devicesService.create(createDeviceDto);
  }

  @Get()
  @AuthSwagger()
  findAll(@Query() paginationDto: PaginationDto) {
    return this.devicesService.findAll(paginationDto);
  }

  @Get(':id')
  @AuthSwagger()
  findById(@Param('id', ParsemongoidPipe) id: string) {
    return this.devicesService.findById(id);
  }

  @Patch(':id')
  @AuthSwagger()
  update(
    @Param('id', ParsemongoidPipe) id: string,
    @Body() updateDeviceDto: UpdateDeviceDto,
  ) {
    return this.devicesService.update(id, updateDeviceDto);
  }

  @Delete(':id')
  @AuthSwagger()
  remove(@Param('id', ParsemongoidPipe) id: string) {
    return this.devicesService.remove(id);
  }
}
