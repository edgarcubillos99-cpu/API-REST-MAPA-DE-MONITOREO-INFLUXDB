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
import { EnlacesService } from './enlaces.service';
import { CreateEnlaceDto } from './dto/create-enlace.dto';
import { UpdateEnlaceDto } from './dto/update-enlace.dto';
import { ApiTags } from '@nestjs/swagger';
import { AuthSwagger } from 'src/common/decorator/auth-swagger.decorator';
import { PaginationDto } from 'src/common/dto/pagination.dto';
import { Public } from 'src/common/decorator/public.decorator';
import { ParsemongoidPipe } from 'src/common/pipes/parse-mongoid.pipe';
import { ValidateIpv4Pipe } from 'src/common/pipes/validate-ipv4.pipe';

@ApiTags('enlaces')
@Controller('enlaces')
export class EnlacesController {
  constructor(private readonly enlacesService: EnlacesService) {}

  @Post()
  @AuthSwagger()
  create(@Body() createEnlaceDto: CreateEnlaceDto) {
    return this.enlacesService.create(createEnlaceDto);
  }

  @Public()
  @Get()
  findAll(@Query() paginationDto: PaginationDto) {
    return this.enlacesService.findAll(paginationDto);
  }

  @Public()
  @Get(':id')
  findById(@Param('id', ParsemongoidPipe) id: string) {
    return this.enlacesService.findById(id);
  }

  @Get('snmp/:ip')
  snmp(@Param('ip', ValidateIpv4Pipe) ip: string) {
    return this.enlacesService.snmpQuerySubtree(ip);
  }

  @Patch(':id')
  @AuthSwagger()
  update(
    @Param('id', ParsemongoidPipe) id: string,
    @Body() updateEnlaceDto: UpdateEnlaceDto,
  ) {
    return this.enlacesService.update(id, updateEnlaceDto);
  }

  @Delete(':id')
  @AuthSwagger()
  remove(@Param('id', ParsemongoidPipe) id: string) {
    return this.enlacesService.remove(id);
  }
}
