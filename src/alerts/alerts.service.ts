import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CreateAlertDto } from './dto/create-alert.dto';
import { UpdateAlertDto } from './dto/update-alert.dto';
import { Alert } from './entities/alert.entity';
import { Model } from 'mongoose';
import { InjectModel } from '@nestjs/mongoose';
import { CommonService } from 'src/common/common.service';
import { Device } from 'src/devices/entities/device.entity';

@Injectable()
export class AlertsService {
  constructor(
    @InjectModel(Alert.name) private _alertsModel: Model<Alert>,
    @InjectModel(Device.name) private _deviceModel: Model<Device>,
    private readonly commonService: CommonService,
  ) {}

  async create(createAlertDto: CreateAlertDto) {
    try {
      //VALIDAR QUE LOS DISPOSITIVOS EXISTAN
      await this.validateDevices(createAlertDto.devices);

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

      //VALIDAR QUE LOS DISPOSITIVOS EXISTAN (SI SE ENVÍAN)
      if (updateAlertDto.devices && updateAlertDto.devices.length > 0) {
        await this.validateDevices(updateAlertDto.devices);
      }

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

  /**
   * @description validar que los dispositivos existan
   * @param deviceIds: string[] - Array de IDs de dispositivos
   * @throws BadRequestException - Si alguno de los dispositivos no existe o no está activo
   * @returns void - Si todos los dispositivos existen y están activos
   */
  async validateDevices(deviceIds: string[]): Promise<void> {
    //VALIDAR QUE LOS DISPOSITIVOS EXISTAN
    const devices = await this._deviceModel.find({
      _id: { $in: deviceIds },
      isActive: true,
    });

    //ENCONTRAR LOS IDs QUE NO EXISTEN
    const foundIds = devices.map((device) => device._id.toString());
    const missingIds = deviceIds.filter((id) => !foundIds.includes(id));

    //VERIFICAR QUE TODOS LOS IDs EXISTAN
    if (devices.length !== deviceIds.length) {
      throw new BadRequestException(
        `The following device IDs do not exist or are not active: ${missingIds.join(', ')}`,
      );
    }
  }
}
