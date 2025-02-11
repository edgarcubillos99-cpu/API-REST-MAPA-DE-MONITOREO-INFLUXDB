import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateMapaDto } from './dto/create-mapa.dto';
import { UpdateMapaDto } from './dto/update-mapa.dto';
import { Mapa } from './entities/mapa.entity';
import { Model } from 'mongoose';
import { InjectModel } from '@nestjs/mongoose';
import { CommonService } from 'src/common/common.service';
import { PaginationDto } from 'src/common/dto/pagination.dto';

@Injectable()
export class MapasService {
  constructor(
    @InjectModel(Mapa.name) private _mapaModel: Model<Mapa>,
    private readonly commonService: CommonService,
  ) {}

  async create(createMapaDto: CreateMapaDto) {
    try {
      const mapa = await this._mapaModel.create(createMapaDto);

      return mapa;
    } catch (error) {
      this.commonService.handleExceptions(error);
    }
  }

  async findAll(paginationDto: PaginationDto) {
    const { limit = 10, offset = 0, name } = paginationDto;
    let result: any;

    if (name) {
      result = await this._mapaModel
        .find({
          isActive: true,
          $or: [
            { nombre: { $regex: `^${name}`, $options: 'i' } },
          ],
        })
        .skip(offset)
        .limit(limit)
        .exec();

      return result;
    }

    result = await this._mapaModel
      .find({ isActive: true })
      .skip(offset)
      .limit(limit)
      .exec();

    return result;
  }

  async findById(id: string) {
    const mapa = await this._mapaModel
      .findOne({
        _id: id,
        isActive: true,
      })
      .exec();

    if (!mapa) throw new NotFoundException(`Mapa with id ${id} not found`);

    return mapa;
  }

  async update(id: string, updateMapaDto: UpdateMapaDto) {
    try {
      const mapa = await this.findById(id);
      const updatedmapa = await mapa.updateOne(updateMapaDto);

      return updatedmapa;
    } catch (error) {
      this.commonService.handleExceptions(error);
    }
  }

  async remove(id: string) {
    const mapa = await this.findById(id);

    // ELIMINADO EL MAPA ENCONTRADO
    await mapa.updateOne({ isActive: false });

    return `Mapa ${mapa.nombre} Delete!`;
  }
}
