import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateEnlaceDto } from './dto/create-enlace.dto';
import { UpdateEnlaceDto } from './dto/update-enlace.dto';
import { Enlace } from './entities/enlace.entity';
import { CommonService } from 'src/common/common.service';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { PaginationDto } from 'src/common/dto/pagination.dto';

@Injectable()
export class EnlacesService {
  constructor(
    @InjectModel(Enlace.name) private _enlaceModel: Model<Enlace>,
    private readonly commonService: CommonService,
  ) {}
  async create(createEnlaceDto: CreateEnlaceDto) {
    try {
      const enlace = await this._enlaceModel.create(createEnlaceDto);

      return enlace;
    } catch (error) {
      this.commonService.handleExceptions(error);
    }
  }

  async findAll(paginationDto: PaginationDto) {
    const { limit = 10, offset = 0, name } = paginationDto;
    let result: any;

    if (name) {
      result = await this._enlaceModel
        .find({
          isActive: true,
          $or: [{ description: { $regex: `^${name}`, $options: 'i' } }],
        })
        .skip(offset)
        .limit(limit)
        .exec();

      return result;
    }

    result = await this._enlaceModel
      .find({ isActive: true })
      .skip(offset)
      .limit(limit)
      .exec();

    return result;
  }

  async findById(id: string) {
    const enlace = await this._enlaceModel
      .findOne({
        _id: id,
        isActive: true,
      })
      .exec();

    if (!enlace) throw new NotFoundException(`Enlace with id ${id} not found`);

    return enlace;
  }

  async update(id: string, updateEnlaceDto: UpdateEnlaceDto) {
    try {
      const enlace = await this.findById(id);
      const updatedEnlace = await enlace.updateOne(updateEnlaceDto);

      return updatedEnlace;
    } catch (error) {
      this.commonService.handleExceptions(error);
    }
  }

  async remove(id: string) {
    const enlace = await this.findById(id);

    // ELIMINADO EL ENLACE ENCONTRADO
    await enlace.updateOne({ isActive: false });

    return `Enlace ${enlace._id} Delete!`;
  }
}
