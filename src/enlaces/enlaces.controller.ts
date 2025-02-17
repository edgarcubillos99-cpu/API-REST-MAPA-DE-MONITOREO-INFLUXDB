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

@ApiTags('enlaces')
@Controller('enlaces')
export class EnlacesController {
  constructor(private readonly enlacesService: EnlacesService) {}

  @Post()
  @AuthSwagger()
  create(@Body() createEnlaceDto: CreateEnlaceDto) {
    return this.enlacesService.create(createEnlaceDto);
  }

  @Get()
  findAll(@Query() paginationDto: PaginationDto) {
    return this.enlacesService.findAll(paginationDto);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.enlacesService.findOne(+id);
  }

  @Patch(':id')
  @AuthSwagger()
  update(@Param('id') id: string, @Body() updateEnlaceDto: UpdateEnlaceDto) {
    return this.enlacesService.update(+id, updateEnlaceDto);
  }

  @Delete(':id')
  @AuthSwagger()
  remove(@Param('id') id: string) {
    return this.enlacesService.remove(+id);
  }
}
