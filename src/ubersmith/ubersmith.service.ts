import { Injectable } from '@nestjs/common';
import { CreateUbersmithDto } from './dto/create-ubersmith.dto';
import { UpdateUbersmithDto } from './dto/update-ubersmith.dto';

@Injectable()
export class UbersmithService {
  create(createUbersmithDto: CreateUbersmithDto) {
    return 'This action adds a new ubersmith';
  }

  findAll() {
    return `This action returns all ubersmith`;
  }

  findOne(id: number) {
    return `This action returns a #${id} ubersmith`;
  }

  update(id: number, updateUbersmithDto: UpdateUbersmithDto) {
    return `This action updates a #${id} ubersmith`;
  }

  remove(id: number) {
    return `This action removes a #${id} ubersmith`;
  }
}
