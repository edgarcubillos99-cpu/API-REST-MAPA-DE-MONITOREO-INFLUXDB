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
import { ChannelsService } from './channels.service';
import { CreateChannelDto } from './dto/create-channel.dto';
import { UpdateChannelDto } from './dto/update-channel.dto';
import { PaginationDto } from 'src/common/dto/pagination.dto';
import { ParsemongoidPipe } from 'src/common/pipes/parse-mongoid.pipe';
import { AuthSwagger } from 'src/common/decorator/auth-swagger.decorator';
import { ApiTags } from '@nestjs/swagger';

@ApiTags('channels')
@AuthSwagger()
@Controller('channels')
export class ChannelsController {
  constructor(private readonly channelsService: ChannelsService) {}

  @Post()
  create(@Body() createChannelDto: CreateChannelDto) {
    return this.channelsService.create(createChannelDto);
  }

  @Get()
  findAll(@Query() paginationDto: PaginationDto) {
    return this.channelsService.findAll(paginationDto);
  }

  @Get(':id')
  findById(@Param('id', ParsemongoidPipe) id: string) {
    return this.channelsService.findById(id);
  }

  @Patch(':id')
  update(
    @Param('id', ParsemongoidPipe) id: string,
    @Body() updateChannelDto: UpdateChannelDto,
  ) {
    return this.channelsService.update(id, updateChannelDto);
  }

  @Delete(':id')
  remove(@Param('id', ParsemongoidPipe) id: string) {
    return this.channelsService.remove(id);
  }
}
