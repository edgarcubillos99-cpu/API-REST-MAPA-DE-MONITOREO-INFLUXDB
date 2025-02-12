import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateDeviceDto } from './dto/create-device.dto';
import { UpdateDeviceDto } from './dto/update-device.dto';
import { InjectModel } from '@nestjs/mongoose';
import { Device } from './entities/device.entity';
import { Model } from 'mongoose';
import { CommonService } from 'src/common/common.service';
import { PaginationDto } from 'src/common/dto/pagination.dto';
import { MapasService } from 'src/mapas/mapas.service';
import { Mapa } from 'src/mapas/entities/mapa.entity';

@Injectable()
export class DevicesService {
  constructor(
    @InjectModel(Device.name) private _deviceModel: Model<Device>,
    @InjectModel(Mapa.name) private _mapaModel: Model<Mapa>,
    private readonly commonService: CommonService,
    private readonly mapasService: MapasService,
  ) {}

  async create(createDeviceDto: CreateDeviceDto) {
    try {
      const mapa = await this.mapasService.findById(createDeviceDto.MapUUID);
      const device = await this._deviceModel.create(createDeviceDto);

      //ACTUALIZANDO EL CAMPO DE DEVICES EN MAPAS
      await mapa.updateOne({
        $inc: { AmountDevices: 1 },
        $push: { Devices: device._id },
      });

      return device;
    } catch (error) {
      this.commonService.handleExceptions(error);
    }
  }

  async findAll(paginationDto: PaginationDto) {
    const { limit = 10, offset = 0, name } = paginationDto;
    let result: any;

    if (name) {
      result = await this._deviceModel
        .find({
          isActive: true,
          $or: [{ nombre: { $regex: `^${name}`, $options: 'i' } }],
        })
        .skip(offset)
        .limit(limit)
        .exec();

      return result;
    }

    result = await this._deviceModel
      .find({ isActive: true })
      .skip(offset)
      .limit(limit)
      .exec();

    return result;
  }

  async findById(id: string) {
    const device = await this._deviceModel
      .findOne({
        _id: id,
        isActive: true,
      })
      .exec();

    if (!device) throw new NotFoundException(`Device with id ${id} not found`);

    return device;
  }

  async update(id: string, updateDeviceDto: UpdateDeviceDto) {
    try {
      const device = await this.findById(id);
      const updatedDevice = await device.updateOne(updateDeviceDto);

      return updatedDevice;
    } catch (error) {
      this.commonService.handleExceptions(error);
    }
  }

  async remove(id: string) {
    const device = await this.findById(id);

    // ACTUALIZANDO EL MAPA PARA REMOVER EL DEVICE
    await this._mapaModel.updateOne(
      { _id: device.MapUUID },
      {
        $inc: { AmountDevices: -1 },
        $pull: { Devices: device._id },
      },
    );

    // ELIMINADO EL DEVICE ENCONTRADO
    await device.updateOne({ isActive: false });

    return `Device ${device.nombre} Delete!`;
  }
}
