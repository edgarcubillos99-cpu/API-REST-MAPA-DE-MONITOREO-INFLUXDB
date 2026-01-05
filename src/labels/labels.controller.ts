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
import { LabelsService } from './labels.service';
import { CreateLabelDto } from './dto/create-label.dto';
import { UpdateLabelDto } from './dto/update-label.dto';
import { PaginationDto } from 'src/common/dto/pagination.dto';
import { ParsemongoidPipe } from 'src/common/pipes/parse-mongoid.pipe';
import { ApiTags } from '@nestjs/swagger';
import { AuthSwagger } from 'src/common/decorator/auth-swagger.decorator';

@ApiTags('labels')
@Controller('labels')
export class LabelsController {
  constructor(private readonly labelsService: LabelsService) {}

  @Post()
  @AuthSwagger()
  create(@Body() createLabelDto: CreateLabelDto) {
    return this.labelsService.create(createLabelDto);
  }

  @Get()
  @AuthSwagger()
  findAll(@Query() paginationDto: PaginationDto) {
    return this.labelsService.findAll(paginationDto);
  }

  @Get('mapa/:id')
  @AuthSwagger()
  findByMapa(
    @Param('id', ParsemongoidPipe) id: string,
    @Query() paginationDto: PaginationDto,
  ) {
    return this.labelsService.findByMapa(id, paginationDto);
  }

  @Get(':id')
  @AuthSwagger()
  findById(@Param('id', ParsemongoidPipe) id: string) {
    return this.labelsService.findById(id);
  }

  @Patch(':id')
  @AuthSwagger()
  update(
    @Param('id', ParsemongoidPipe) id: string,
    @Body() updateLabelDto: UpdateLabelDto,
  ) {
    return this.labelsService.update(id, updateLabelDto);
  }

  @Delete(':id')
  @AuthSwagger()
  remove(@Param('id', ParsemongoidPipe) id: string) {
    return this.labelsService.remove(id);
  }
}
