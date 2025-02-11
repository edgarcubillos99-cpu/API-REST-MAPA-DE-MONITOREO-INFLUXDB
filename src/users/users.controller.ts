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
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { ParsemongoidPipe } from 'src/common/pipes/parse-mongoid.pipe';
import { Public } from 'src/common/decorator/public.decorator';
import { AuthSwagger } from 'src/common/decorator/auth-swagger.decorator';
import { ApiTags } from '@nestjs/swagger';
import { PaginationDto } from 'src/common/dto/pagination.dto';

@ApiTags('users')
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post()
  @AuthSwagger()
  create(@Body() createUserDto: CreateUserDto) {
    return this.usersService.create(createUserDto);
  }

  @Public()
  @Get()
  findAll(@Query() paginationDto: PaginationDto) {
    return this.usersService.findAll(paginationDto);
  }

  @Public()
  @Get(':id')
  findById(@Param('id', ParsemongoidPipe) id: string) {
    return this.usersService.findById(id);
  }

  @Patch(':id')
  @AuthSwagger()
  update(
    @Param('id', ParsemongoidPipe) id: string,
    @Body() updateUserDto: UpdateUserDto,
  ) {
    return this.usersService.update(id, updateUserDto);
  }

  @Delete(':id')
  @AuthSwagger()
  remove(@Param('id', ParsemongoidPipe) id: string) {
    return this.usersService.remove(id);
  }
}
