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
import { MapasService } from './mapas.service';
import { CreateMapaDto } from './dto/create-mapa.dto';
import { UpdateMapaDto } from './dto/update-mapa.dto';
import { ApiTags } from '@nestjs/swagger';
import { AuthSwagger } from 'src/common/decorator/auth-swagger.decorator';
import { PaginationDto } from 'src/common/dto/pagination.dto';
import { ParsemongoidPipe } from 'src/common/pipes/parse-mongoid.pipe';

@ApiTags('mapas')
@Controller('mapas')
export class MapasController {
  constructor(private readonly mapasService: MapasService) {}

  @Post()
  @AuthSwagger()
  create(@Body() createMapaDto: CreateMapaDto) {
    return this.mapasService.create(createMapaDto);
  }

  @Get()
  @AuthSwagger()
  findAll(@Query() paginationDto: PaginationDto) {
    return this.mapasService.findAll(paginationDto);
  }

  @Get(':id')
  @AuthSwagger()
  findById(@Param('id', ParsemongoidPipe) id: string) {
    return this.mapasService.findById(id);
  }

  @Get(':id/devices')
  @AuthSwagger()
  findAllDevicesInMapa(
    @Param('id', ParsemongoidPipe) id: string,
    @Query() paginationDto: PaginationDto,
  ) {
    return this.mapasService.findAllDevicesInMapa(id, paginationDto);
  }

  @Patch(':id')
  @AuthSwagger()
  update(
    @Param('id', ParsemongoidPipe) id: string,
    @Body() updateMapaDto: UpdateMapaDto,
  ) {
    return this.mapasService.update(id, updateMapaDto);
  }

  @Delete(':id')
  @AuthSwagger()
  remove(@Param('id', ParsemongoidPipe) id: string) {
    return this.mapasService.remove(id);
  }
}
