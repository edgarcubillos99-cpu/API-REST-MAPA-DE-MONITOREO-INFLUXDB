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
import { ClasificationsService } from './clasifications.service';
import { CreateClasificationDto } from './dto/create-clasification.dto';
import { UpdateClasificationDto } from './dto/update-clasification.dto';
import { ApiTags } from '@nestjs/swagger';
import { AuthSwagger } from 'src/common/decorator/auth-swagger.decorator';
import { ParsemongoidPipe } from 'src/common/pipes/parse-mongoid.pipe';
import { PaginationDto } from 'src/common/dto/pagination.dto';

@ApiTags('clasifications')
@Controller('clasifications')
export class ClasificationsController {
  constructor(private readonly clasificationsService: ClasificationsService) {}

  @Post()
  @AuthSwagger()
  create(@Body() createClasificationDto: CreateClasificationDto) {
    return this.clasificationsService.create(createClasificationDto);
  }

  @Get()
  @AuthSwagger()
  findAll(@Query() paginationDto: PaginationDto) {
    return this.clasificationsService.findAll(paginationDto);
  }

  @Get(':id')
  @AuthSwagger()
  findById(@Param('id', ParsemongoidPipe) id: string) {
    return this.clasificationsService.findById(id);
  }

  @Patch(':id')
  @AuthSwagger()
  update(
    @Param('id', ParsemongoidPipe) id: string,
    @Body() updateClasificationDto: UpdateClasificationDto,
  ) {
    return this.clasificationsService.update(id, updateClasificationDto);
  }

  @Delete(':id')
  @AuthSwagger()
  remove(@Param('id', ParsemongoidPipe) id: string) {
    return this.clasificationsService.remove(id);
  }
}
