import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { CommonService } from 'src/common/common.service';
import { PaginationDto } from 'src/common/dto/pagination.dto';
import { Mapa } from 'src/mapas/entities/mapa.entity';
import { CreateLabelDto } from './dto/create-label.dto';
import { UpdateLabelDto } from './dto/update-label.dto';
import { Label } from './entities/label.entity';

@Injectable()
export class LabelsService {
  constructor(
    @InjectModel(Label.name) private _labelModel: Model<Label>,
    @InjectModel(Mapa.name) private _mapaModel: Model<Mapa>,
    private readonly commonService: CommonService,
  ) {}

  async create(createLabelDto: CreateLabelDto) {
    try {
      //VALIDAR QUE EL MAPA EXISTA
      await this.validateMapa(createLabelDto.mapa);

      //CREAR EL LABEL
      const label = await this._labelModel.create(createLabelDto);

      //RETORNAR EL LABEL CREADO
      return label;
    } catch (error) {
      this.commonService.handleExceptions(error);
    }
  }

  async findAll(paginationDto: PaginationDto) {
    const { limit = 10, offset = 0 } = paginationDto;

    try {
      const labels = await this._labelModel
        .find()
        .populate('mapa', '_id name')
        .skip(offset)
        .limit(limit);

      return labels;
    } catch (error) {
      this.commonService.handleExceptions(error);
    }
  }

  async findById(id: string) {
    try {
      const label = await this._labelModel
        .findById(id)
        .populate('mapa', '_id name');

      if (!label) {
        throw new NotFoundException(`Label with id ${id} not found`);
      }

      return label;
    } catch (error) {
      this.commonService.handleExceptions(error);
    }
  }

  async findByMapa(mapaId: string, paginationDto: PaginationDto) {
    const { limit = 10, offset = 0 } = paginationDto;

    try {
      //VALIDAR QUE EL MAPA EXISTA
      await this.validateMapa(mapaId);

      const labels = await this._labelModel
        .find({ mapa: mapaId })
        .populate('mapa', '_id name')
        .skip(offset)
        .limit(limit);

      return labels;
    } catch (error) {
      this.commonService.handleExceptions(error);
    }
  }

  async update(id: string, updateLabelDto: UpdateLabelDto) {
    try {
      //VALIDAR QUE EL LABEL EXISTA
      await this.findById(id);

      //VALIDAR QUE EL MAPA EXISTA (SI SE ENVÍA)
      if (updateLabelDto.mapa) {
        await this.validateMapa(updateLabelDto.mapa);
      }

      //ACTUALIZAR EL LABEL
      const updatedLabel = await this._labelModel.findByIdAndUpdate(
        id,
        updateLabelDto,
        { new: true },
      );

      //RETORNAR EL LABEL ACTUALIZADO
      return updatedLabel;
    } catch (error) {
      this.commonService.handleExceptions(error);
    }
  }

  async remove(id: string) {
    try {
      //VALIDAR QUE EL LABEL EXISTA
      await this.findById(id);

      //ELIMINAR EL LABEL
      await this._labelModel.findByIdAndDelete(id);

      return 'Label deleted!';
    } catch (error) {
      this.commonService.handleExceptions(error);
    }
  }

  /**
   * @description Validar que el mapa exista
   * @param mapaId: string - ID del mapa
   * @throws BadRequestException - Si el mapa no existe o no está activo
   * @returns void - Si el mapa existe y está activo
   */
  async validateMapa(mapaId: string): Promise<void> {
    const mapa = await this._mapaModel.findOne({
      _id: mapaId,
      isActive: true,
    });

    if (!mapa) {
      throw new BadRequestException(
        `Mapa with id ${mapaId} does not exist or is not active`,
      );
    }
  }
}
