import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import mongoose, { Model } from 'mongoose';
import { CreateClasificationDto } from './dto/create-clasification.dto';
import { UpdateClasificationDto } from './dto/update-clasification.dto';
import { Clasification } from './entities/clasification.entity';
import { CommonService } from 'src/common/common.service';
import { PaginationDto } from 'src/common/dto/pagination.dto';

@Injectable()
export class ClasificationsService {
  constructor(
    @InjectModel(Clasification.name)
    private readonly _clasificationModel: Model<Clasification>,
    private readonly commonService: CommonService,
  ) {}

  async create(createClasificationDto: CreateClasificationDto) {
    try {
      //BUSCAR SI EXISTE UNA CLASIFICACIÓN DESACTIVADA CON EL MISMO NOMBRE
      const foundClasificationDesactivated =
        await this._clasificationModel.findOne({
          isActive: false,
          name: createClasificationDto.name,
        });

      if (foundClasificationDesactivated) {
        //REACTIVAR LA CLASIFICACIÓN Y ACTUALIZAR SUS CAMPOS
        await foundClasificationDesactivated.updateOne({
          isActive: true,
          ...createClasificationDto,
        });

        //RETORNAR LA CLASIFICACIÓN ACTUALIZADA
        return this._clasificationModel.findById(
          foundClasificationDesactivated._id,
        );
      }

      //SI NO EXISTE, CREAR NORMALMENTE
      const clasification = await this._clasificationModel.create(
        createClasificationDto,
      );

      return clasification;
    } catch (error) {
      this.commonService.handleExceptions(error);
    }
  }

  async findAll(paginationDto: PaginationDto) {
    const { limit = 10, offset = 0, name } = paginationDto;

    const matchFilter: any = { isActive: true };

    if (name) {
      matchFilter.name = { $regex: name, $options: 'i' };
    }

    return this._clasificationModel.aggregate([
      { $match: matchFilter },
      { $skip: offset },
      { $limit: limit },
      {
        $lookup: {
          from: 'mapas',
          let: { classificationId: '$_id' },
          pipeline: [
            {
              $match: {
                $expr: {
                  $and: [
                    { $in: ['$$classificationId', { $ifNull: ['$classifications', []] }] },
                    { $eq: ['$isActive', true] },
                  ],
                },
              },
            },
            { $project: { _id: 1 } },
          ],
          as: 'mapas',
        },
      },
      {
        $addFields: {
          amountMapas: { $size: '$mapas' },
        },
      },
      {
        $project: {
          mapas: 0,
        },
      },
    ]);
  }

  async findById(id: string) {
    const clasification = await this._clasificationModel.findOne({
      _id: id,
      isActive: true,
    });

    if (!clasification) {
      throw new NotFoundException(`Clasificación con id ${id} no encontrada`);
    }

    return clasification;
  }

  async update(id: string, updateClasificationDto: UpdateClasificationDto) {
    try {
      await this.findById(id);

      const updatedClasification =
        await this._clasificationModel.findOneAndUpdate(
          { _id: id },
          updateClasificationDto,
          { new: true },
        );

      return updatedClasification;
    } catch (error) {
      this.commonService.handleExceptions(error);
    }
  }

  async remove(id: string) {
    const clasification = await this.findById(id);

    //SOFT DELETE
    await clasification.updateOne({ isActive: false });

    return `Clasificación ${clasification.name} eliminada`;
  }

  /**
   * @description Validar que las clasificaciones existan y estén activas
   * @param classificationIds - Array de IDs de clasificaciones
   * @throws BadRequestException - Si alguna clasificación no existe o no está activa
   */
  async validateClassifications(classificationIds: string[]): Promise<void> {
    const classifications = await this._clasificationModel.find({
      _id: { $in: classificationIds },
      isActive: true,
    });

    const foundIds = classifications.map((c) => c._id.toString());
    const missingIds = classificationIds.filter((id) => !foundIds.includes(id));

    if (classifications.length !== classificationIds.length) {
      throw new BadRequestException(
        `Las siguientes clasificaciones no existen o no están activas: ${missingIds.join(', ')}`,
      );
    }
  }
}
