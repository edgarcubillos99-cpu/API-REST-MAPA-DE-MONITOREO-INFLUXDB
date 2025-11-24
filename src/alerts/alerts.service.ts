import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateAlertDto } from './dto/create-alert.dto';
import { UpdateAlertDto } from './dto/update-alert.dto';
import { Alert } from './entities/alert.entity';
import { Model } from 'mongoose';
import { InjectModel } from '@nestjs/mongoose';
import { CommonService } from 'src/common/common.service';

@Injectable()
export class AlertsService {
  constructor(
    @InjectModel(Alert.name) private _alertsModel: Model<Alert>,
    private readonly commonService: CommonService,
  ) {}

  async create(createAlertDto: CreateAlertDto) {
    try {
      //CREAR LA ALERTA
      const alert = await this._alertsModel.create(createAlertDto);

      //RETORNAR LA ALERTA CREADA
      return alert;
    } catch (error) {
      this.commonService.handleExceptions(error);
    }
  }

  async findAll() {
    try {
      const alerts = await this._alertsModel.find();

      return alerts;
    } catch (error) {
      this.commonService.handleExceptions(error);
    }
  }

  async findById(id: string) {
    try {
      const alert = await this._alertsModel.findById(id).populate('devices');

      if (!alert) {
        throw new NotFoundException(`Alert with id ${id} not found`);
      }

      return alert;
    } catch (error) {
      this.commonService.handleExceptions(error);
    }
  }

  async update(id: string, updateAlertDto: UpdateAlertDto) {
    try {
      //VALIDAR QUE LA ALERTA EXISTA
      await this.findById(id);

      //ACTUALIZAR LA ALERTA
      const updatedAlert = await this._alertsModel.findByIdAndUpdate(
        id,
        updateAlertDto,
        { new: true },
      );

      //RETORNAR LA ALERTA ACTUALIZADA
      return updatedAlert;
    } catch (error) {
      this.commonService.handleExceptions(error);
    }
  }

  async remove(id: string) {
    try {
      //VALIDAR QUE LA ALERTA EXISTA
      await this.findById(id);

      //ELIMINAR LA ALERTA
      await this._alertsModel.findByIdAndDelete(id);

      return 'Alert deleted!';
    } catch (error) {
      this.commonService.handleExceptions(error);
    }
  }
}
