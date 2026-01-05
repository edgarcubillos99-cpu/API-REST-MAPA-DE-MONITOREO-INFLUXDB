import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { UbersmithService } from './ubersmith.service';
import { CreateUbersmithDto } from './dto/create-ubersmith.dto';
import { UpdateUbersmithDto } from './dto/update-ubersmith.dto';

@Controller('ubersmith')
export class UbersmithController {
  constructor(private readonly ubersmithService: UbersmithService) {}

  @Post()
  create(@Body() createUbersmithDto: CreateUbersmithDto) {
    return this.ubersmithService.create(createUbersmithDto);
  }

  @Get()
  findAll() {
    return this.ubersmithService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.ubersmithService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateUbersmithDto: UpdateUbersmithDto) {
    return this.ubersmithService.update(+id, updateUbersmithDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.ubersmithService.remove(+id);
  }
}
