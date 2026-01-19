import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { CreateDeviceDto } from './dto/create-device.dto';
import { UpdateDeviceDto } from './dto/update-device.dto';
import { InjectConnection, InjectModel } from '@nestjs/mongoose';
import { Device } from './entities/device.entity';
import mongoose, { Model } from 'mongoose';
import { CommonService } from 'src/common/common.service';
import { PaginationDto } from 'src/common/dto/pagination.dto';
import { MapasService } from 'src/mapas/mapas.service';
import { Mapa } from 'src/mapas/entities/mapa.entity';
import { EventLog } from 'src/event-logs/entities/event-log.entity';
import { EventEmitter2, OnEvent } from '@nestjs/event-emitter';
import { STATUS } from 'src/common/enums/status.enum';
import { EVENT_LOGS } from 'src/common/enums/event-logs.enum';
import { Cron } from '@nestjs/schedule';
import axios from 'axios';
import * as path from 'path';
import * as fs from 'fs';
import { DataSource } from 'typeorm';
import amqp from 'amqp-connection-manager';
import { EVENT_LOGS_TYPE } from 'src/event-logs/enums/event-logs-type.enum';

const Client = require('ssh2').Client;

@Injectable()
export class DevicesService {
  private channelWrapper: any;

  constructor(
    @InjectModel(Device.name) private _deviceModel: Model<Device>,
    @InjectModel(Mapa.name) private _mapaModel: Model<Mapa>,
    @InjectModel(EventLog.name) private _eventLogModel: Model<EventLog>,
    @InjectConnection() private readonly connection: mongoose.Connection,
    private readonly commonService: CommonService,
    private readonly mapasService: MapasService,
    private eventEmitter: EventEmitter2,
    //private readonly dataSource: DataSource,
  ) {
    const connectionRabbitMQ = amqp.connect([process.env.RABBITMQ_URL]);
    this.channelWrapper = connectionRabbitMQ.createChannel({
      json: true,
      setup: (channel: any) => {
        //NO DECLARAMOS LA COLA AQUI YA QUE SERAN DINAMICAS
        return Promise.resolve();
      },
    });
  }

  private readonly logger = new Logger(DevicesService.name);

  @OnEvent(EVENT_LOGS.DEVICE_STATUS_ICMP_CHANGED)
  async handledeviceStatusIcmpChangedEvent(payload: any) {
    const { _id, StatusIcmp, lastChangeStatusTime } = payload;

    //BUSCAR EL ÚLTIMO LOG REGISTRADO PARA EL DISPOSITIVO ESPECÍFICO,
    //ORDENANDO POR LA FECHA DE CAMBIO DE ESTADO (changedAt) DE FORMA DESCENDENTE
    //BUSCAR EN EL ARREGLO devices QUE CONTENGA EL _id DEL DISPOSITIVO
    const lastLog = await this._eventLogModel
      .findOne({ devices: _id, logType: EVENT_LOGS_TYPE.DEVICE })
      .sort({ changedAt: -1 })
      .lean();

    //SI EL ESTADO NO HA CAMBIADO, NO SE REGISTRA NINGÚN LOG
    if (lastLog && lastLog.Status === StatusIcmp) {
      return;
    }

    let elapsedFormatted = '00:00:00.000';
    let StatusTransition: {
      from: string;
      to: string;
    } | null = null;

    if (lastLog?.changedAt) {
      const elapsedMs =
        new Date(lastChangeStatusTime).getTime() -
        new Date(lastLog.changedAt).getTime();

      const hours = Math.floor(elapsedMs / 3600000);
      const minutes = Math.floor((elapsedMs % 3600000) / 60000);
      const seconds = Math.floor((elapsedMs % 60000) / 1000);
      const milliseconds = elapsedMs % 1000;

      elapsedFormatted =
        `${hours.toString().padStart(2, '0')}:` +
        `${minutes.toString().padStart(2, '0')}:` +
        `${seconds.toString().padStart(2, '0')}.` +
        `${milliseconds.toString().padStart(3, '0')}`;

      StatusTransition = {
        from: lastLog.Status,
        to: StatusIcmp,
      };
    }

    await this._eventLogModel.create({
      devices: [_id],
      Status: StatusIcmp,
      changedAt: lastChangeStatusTime,
      Time: elapsedFormatted,
      StatusTransition,
      logType: EVENT_LOGS_TYPE.DEVICE,
      message: StatusTransition
        ? `Cantidad de tiempo ${StatusTransition?.from} ${elapsedFormatted}`
        : null,
    });
  }

  async create(createDeviceDto: CreateDeviceDto) {
    const session = await this.connection.startSession();
    session.startTransaction();

    try {
      //BUSCAR SI EXISTE UN DISPOSITIVO DESACTIVADO CON EL MISMO IP
      const foundDeviceDesactivated = await this._deviceModel.findOne({
        isActive: false,
        ip: createDeviceDto.ip,
      });

      if (foundDeviceDesactivated) {
        const prevStatusIcmp = foundDeviceDesactivated.StatusIcmp;
        const newStatusIcmp = createDeviceDto.StatusIcmp;

        const deviceRecreatedPayload: any = {
          isActive: true,
          ...createDeviceDto,
        };

        //SOLO ACTUALIZA EL TIMESTAMP SI EL ESTADO CAMBIO
        if (prevStatusIcmp !== newStatusIcmp) {
          const now = new Date();
          deviceRecreatedPayload.lastChangeStatusTime = now;
        }

        //REACTIVAR EL DISPOSITIVO Y ACTUALIZAR SUS CAMPOS
        await foundDeviceDesactivated.updateOne(deviceRecreatedPayload, {
          session,
        });

        //ACTUALIZAR LOS MAPAS RELACIONADOS
        for (const mapUUID of createDeviceDto.MapUUID) {
          const mapa = await this.mapasService.findById(mapUUID);
          await mapa.updateOne(
            {
              $inc: { AmountDevices: 1 },
              $push: { Devices: foundDeviceDesactivated._id },
            },
            { session },
          );
        }
        //CONFIRMANDO LA TRANSACCION
        await session.commitTransaction();

        //RETORNAMOS EL DEVICE ACTUALIZADO
        const deviceRecreated = await this._deviceModel.findById(
          foundDeviceDesactivated._id,
        );

        //EMITIR EVENTLOGS DESPUES DE REACTIVAR EL DEVICE SOLO SI EL ESTADO CAMBIO
        //NO EMITIR NI CREES UN LOG SI EL ESTADO ANTERIOR Y EL NUEVO SON IGUALES
        if (prevStatusIcmp !== newStatusIcmp) {
          this.eventEmitter.emit(EVENT_LOGS.DEVICE_STATUS_ICMP_CHANGED, {
            _id: deviceRecreated?._id,
            StatusIcmp: deviceRecreated?.StatusIcmp,
            lastChangeStatusTime: deviceRecreated?.lastChangeStatusTime,
          });
        }

        return deviceRecreated;
      }

      //SI NO EXISTE, CREAR NORMALMENTE
      const device = await this._deviceModel.create([createDeviceDto], {
        session,
      });

      //ITERAR SOBRE EL ARREGLO de MapUUID
      for (const mapUUID of createDeviceDto.MapUUID) {
        const mapa = await this.mapasService.findById(mapUUID);

        //ACTUALIZANDO EL CAMPO DE DEVICES EN CADA MAPA
        await mapa
          .updateOne({
            $inc: { AmountDevices: 1 },
            $push: { Devices: device[0]._id },
          })
          .session(session);
      }

      //CONFIRMANDO LA TRANSACCION
      await session.commitTransaction();

      //EMITIR EVENTO DESPUÉS DE CREAR EL DEVICE
      this.eventEmitter.emit(EVENT_LOGS.DEVICE_STATUS_ICMP_CHANGED, {
        _id: device[0]._id,
        StatusIcmp: device[0].StatusIcmp,
        lastChangeStatusTime: device[0].lastChangeStatusTime,
      });

      //RETORNAMOS EL DEVICE CREADO OBJETO [0]
      return device[0];
    } catch (error) {
      this.commonService.handleExceptions(error);
      //ABORTANDO TODOS LOS CAMBIOS A BASE DE DATOS
      session.abortTransaction();
    } finally {
      await session.endSession();
    }
  }

  async findAll(paginationDto: PaginationDto) {
    const { limit = 10, offset = 0, name } = paginationDto;
    let result: any;

    if (name) {
      result = await this._deviceModel
        .find({
          isActive: true,
          $or: [{ name: { $regex: `^${name}`, $options: 'i' } }],
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
    const session = await this.connection.startSession();
    session.startTransaction();

    try {
      const devicePayload = {
        ...updateDeviceDto,
      };

      const device = await this.findById(id);

      //BANDERA PARA SABER SI SE CAMBIO EL STATUSICMP
      let statusIcmpChanged = false;

      //SI CAMBIA EL STATUSICMP, ACTUALIZA EL TIMESTAMP
      if (
        updateDeviceDto.StatusIcmp &&
        updateDeviceDto.StatusIcmp !== device.StatusIcmp
      ) {
        devicePayload['lastChangeStatusTime'] = Date.now();
        statusIcmpChanged = true;
      }

      //SI SE PASA EL CAMPO MapUUID
      if (updateDeviceDto.MapUUID) {
        //ITERAR SOBRE EL ARREGLO DE MapUUID
        for (const mapUUID of device.MapUUID) {
          const mapa = await this._mapaModel.findById(mapUUID);

          //ACTUALIZANDO EL MAPA PARA REMOVER EL DEVICE
          if (mapa)
            await mapa
              .updateOne({
                $inc: { AmountDevices: -1 },
                $pull: { Devices: device._id }, //VERIFICA DEVICE EXISTA EN ARREGLO, SI NO EXISTE NO DISMINUYA EL CONTADOR AmountDevices
              })
              .session(session);
        }

        //ACTUALIZAR EL CAMPO DE MapUUIDs EN EL DISPOSITIVO
        device.MapUUID = updateDeviceDto.MapUUID.map(
          (id) => new mongoose.Types.ObjectId(id),
        );

        //ITERAR SOBRE EL NUEVO ARREGLO DE MapUUID
        for (const mapUUID of updateDeviceDto.MapUUID) {
          const mapa = await this.mapasService.findById(mapUUID.toString());

          //ACTUALIZANDO EL CAMPO DE DEVICES EN CADA MAPA
          await mapa
            .updateOne({
              $inc: { AmountDevices: 1 },
              $push: { Devices: device._id },
            })
            .session(session);
        }
      }

      //CONSTRUIR LA OPERACIÓN DE ACTUALIZACIÓN
      const updateOperation: any = { $set: devicePayload };

      //SI VIENE ubersmithTicketId, AGREGARLO AL ARREGLO listTicketsUbersmith SIN DUPLICADOS
      if (updateDeviceDto.ubersmithTicketId) {
        updateOperation.$addToSet = {
          listTicketsUbersmith: updateDeviceDto.ubersmithTicketId,
        };
      }
 
      //ACTUALIZAR EL DISPOSITIVO
      await this._deviceModel
        .updateOne({ _id: device._id }, updateOperation)
        .session(session);

      //CONFIRMANDO LA TRANSACCION
      await session.commitTransaction();

      //OBTENER EL DEVICE ACTUALIZADO
      const updatedDevice = await this._deviceModel.findById(device._id);

      //EMITIR EVENTO SOLO SI CAMBIO StatusIcmp
      if (statusIcmpChanged) {
        this.eventEmitter.emit(EVENT_LOGS.DEVICE_STATUS_ICMP_CHANGED, {
          _id: updatedDevice?._id,
          StatusIcmp: updatedDevice?.StatusIcmp,
          lastChangeStatusTime: updatedDevice?.lastChangeStatusTime,
        });
      }

      return updatedDevice;
    } catch (error) {
      this.commonService.handleExceptions(error);
      //ABORTANDO TODOS LOS CAMBIOS A BASE DE DATOS
      await session.abortTransaction();
    } finally {
      await session.endSession();
    }
  }

  async remove(id: string) {
    const session = await this.connection.startSession();
    session.startTransaction();

    try {
      const device = await this.findById(id);

      //SOLO EMITIR EVENTLOGS SI EL DISPOSITIVO ESTÁ ACTUALMENTE "up"
      const shouldEmitEventLogs = device.StatusIcmp === STATUS.UP;

      //ITERAR SOBRE EL ARREGLO DE MapUUID
      for (const mapUUID of device.MapUUID) {
        const mapa = await this._mapaModel.findById(mapUUID);

        //ACTUALIZANDO EL MAPA PARA REMOVER EL DEVICE
        if (mapa)
          await mapa
            .updateOne({
              $inc: { AmountDevices: -1 },
              $pull: { Devices: device._id }, //VERIFICA DEVICE EXISTA EN ARREGLO, SI NO EXISTE NO DISMINUYA EL CONTADOR AmountDevices
            })
            .session(session);
      }

      const updatePayload: any = {
        isActive: false,
        StatusIcmp: STATUS.DOWN,
      };

      //SOLO ACTUALIZA EL TIMESTAMP SI EL ESTADO ERA "up"
      if (device.StatusIcmp === STATUS.UP) {
        updatePayload.lastChangeStatusTime = Date.now();
      }

      //ELIMINADO EL DEVICE ENCONTRADO
      await device.updateOne(updatePayload).session(session);

      //CONFIRMANDO LA TRANSACCION
      await session.commitTransaction();

      //EMITIR EVENTLOGS SOLO SI EL DISPOSITIVO ESTABA EN "up" ANTES DE ELIMINARLO
      if (shouldEmitEventLogs) {
        //OBTENER EL DEVICE ELIMINADO
        const removeDevice = await this._deviceModel.findById(device._id);

        this.eventEmitter.emit(EVENT_LOGS.DEVICE_STATUS_ICMP_CHANGED, {
          _id: removeDevice?._id,
          StatusIcmp: removeDevice?.StatusIcmp,
          lastChangeStatusTime: removeDevice?.lastChangeStatusTime,
        });
      }

      return `Device ${device.name} Delete!`;
    } catch (error) {
      this.commonService.handleExceptions(error);
      //BORTANDO TODOS LOS CAMBIOS A BASE DE DATOS
      session.abortTransaction();
    } finally {
      await session.endSession();
    }
  }

/*  async isDevicesInUnimus() {
    //LEER EL ARCHIVO JSON DE IPS A DNS
    const dnsMapPath = path.join(
      __dirname,
      '..',
      'data',
      'osnetpr.com.hosts.json',
    );
    const dnsMap: Record<string, string> = JSON.parse(
      fs.readFileSync(dnsMapPath, 'utf8'),
    );

    //OBTENER TODAS LAS IPS DE LOS DISPOSITIVOS ACTIVOS
    const result = await this._deviceModel.aggregate([
      { $match: { isActive: true } },
      { $project: { _id: 0, ip: 1 } },
    ]);

    const ipDevices: string[] = result.map((device) => device.ip);

    let deviceFound = 0;
    let deviceNotFound = 0;
    const isDevicesInUnimus: string[] = [];
    let r1DevicesToUpdate: any[] = [];
    let r2DevicesToUpdate: any[] = [];

    //PROCESAR EN LOTES PARA NO SOBRECARGAR EL SERVIDOR
    const batchSize = 100;

    try {
      for (let i = 0; i < ipDevices.length; i += batchSize) {
        const batch = ipDevices.slice(i, i + batchSize);

        const batchPromises = batch.map(async (ip) => {
          //SI NO HAY DNS, USA LA IP ORIGINAL
          const dns = dnsMap[ip] || ip;
          try {
            const response = await axios.get(
              `${process.env.UNIMUS_URL}/api/v2/devices/findByAddress/${dns}`,
              {
                headers: {
                  Authorization: `Bearer ${process.env.UNIMUS_TOKEN}`,
                },
              },
            );

            if (response.status === 200 && response.data) {
              deviceFound++;
              isDevicesInUnimus.push(ip);
            } else {
              deviceNotFound++;
            }
          } catch (error) {
            deviceNotFound++;
          }
        });

        await Promise.allSettled(batchPromises);
      }

      r1DevicesToUpdate = await this._deviceModel.aggregate([
        {
          $match: {
            isActive: true,
            ip: { $in: isDevicesInUnimus },
            inUnimus: false,
          },
        },
        {
          $project: {
            _id: 1,
          },
        },
      ]);

      // console.log(r1DevicesToUpdate);

      //ACTUALIZA SI ESTÁ DENTRO DEL ARREGLO isDevicesInUnimus[] Y inUnimus ES false
      const r1 = await this._deviceModel.updateMany(
        {
          isActive: true,
          ip: { $in: isDevicesInUnimus },
          inUnimus: false, //SOLO LOS QUE ESTÁN MARCADOS COMO false
        },
        { $set: { inUnimus: true } },
      );
      this.logger.debug(
        `🔁 inUnimus false → true: matched=${r1.matchedCount}, modified=${r1.modifiedCount}`,
      );

      r2DevicesToUpdate = await this._deviceModel.aggregate([
        {
          $match: {
            isActive: true,
            ip: { $nin: isDevicesInUnimus },
            inUnimus: true,
          },
        },
        {
          $project: {
            _id: 1,
          },
        },
      ]);

      // console.log(r2DevicesToUpdate);

      //ACTUALIZA PARA MARCAR COMO false LOS QUE NO ESTÁN EN isDevicesInUnimus[] Y inUnimus ES true
      //MARCA COMO false LO QUE YA NO ESTÁ EN Unimus, pero antes sí
      const r2 = await this._deviceModel.updateMany(
        {
          isActive: true,
          ip: { $nin: isDevicesInUnimus }, //IPs NO ENCONTRADAS
          inUnimus: true, //SOLO LOS QUE ESTÁN MARCADOS COMO true
        },
        { $set: { inUnimus: false } },
      );

      this.logger.debug(
        `🔁 inUnimus true → false: matched=${r2.matchedCount}, modified=${r2.modifiedCount}`,
      );

      this.logger.debug(
        `devices - found: ${deviceFound}, not found: ${deviceNotFound}`,
      );
    } catch (error) {
      this.logger.error('Error checking devices in Unimus:', error);
      throw error;
    }

    const devicesToUpdate = [...r1DevicesToUpdate, ...r2DevicesToUpdate];
    if (devicesToUpdate.length > 0) {
      // console.log('devicesToUpdate isDeviceinUnimus', devicesToUpdate);
      const devicesToQueue: string[] = devicesToUpdate.map((device) =>
        device._id.toString(),
      );

      // console.log('devicesToQueue isDeviceinUnimus', devicesToQueue);

      // console.log('ENTRO A isDevicesInUnimus');
      //console.log(devicesToQueue.length);
      await this.sendToRabbitMQByMapUUID(devicesToQueue, 'unimus');
    }
  }
*/
/*
  async isDevicesInLibrenms() {
    const dnsMapPath = path.join(
      __dirname,
      '..',
      'data',
      'osnetpr.com.hosts.json',
    );
    const dnsMap: Record<string, string> = JSON.parse(
      fs.readFileSync(dnsMapPath, 'utf8'),
    );

    const result = await this._deviceModel.aggregate([
      { $match: { isActive: true } },
      { $project: { _id: 0, ip: 1 } },
    ]);

    const ipDevices: string[] = result.map((device) => device.ip);

    let deviceFound = 0;
    let deviceNotFound = 0;
    const isDevicesInLibrenms: string[] = [];
    let r1DevicesToUpdate: any[] = [];
    let r2DevicesToUpdate: any[] = [];

    const batchSize = 10;

    try {
      await this.dataSource.query('SELECT 1');
      this.logger.debug('Conexión a la base de datos LibreNMS exitosa');

      for (let i = 0; i < ipDevices.length; i += batchSize) {
        const batch = ipDevices.slice(i, i + batchSize);

        const batchPromises = batch.map(async (ip) => {
          const dns = dnsMap[ip] || ip;
          try {
            const result: any[] = await this.dataSource.query(
              'SELECT hostname FROM devices WHERE hostname = ? AND status = 1 LIMIT 1',
              [dns],
            );

            if (Array.isArray(result) && result.length > 0) {
              deviceFound++;
              isDevicesInLibrenms.push(ip);
            } else {
              deviceNotFound++;
            }
          } catch (error) {
            this.logger.error(`Error querying LibreNMS DB for ${dns}:`, error);
            deviceNotFound++;
          }
        });

        await Promise.allSettled(batchPromises);
      }

      r1DevicesToUpdate = await this._deviceModel.aggregate([
        {
          $match: {
            isActive: true,
            ip: { $in: isDevicesInLibrenms },
            inLibrenms: false,
          },
        },
        {
          $project: {
            _id: 1,
          },
        },
      ]);

      //MARCAR como inLibrenms: true donde aplica
      const r1 = await this._deviceModel.updateMany(
        {
          isActive: true,
          ip: { $in: isDevicesInLibrenms },
          inLibrenms: false,
        },
        { $set: { inLibrenms: true } },
      );
      this.logger.debug(
        `🔁 inLibrenms false → true: matched=${r1.matchedCount}, modified=${r1.modifiedCount}`,
      );

      r2DevicesToUpdate = await this._deviceModel.aggregate([
        {
          $match: {
            isActive: true,
            ip: { $nin: isDevicesInLibrenms },
            inLibrenms: true,
          },
        },
        {
          $project: {
            _id: 1,
          },
        },
      ]);

      //MARCAR como inLibrenms: false si ya no está
      const r2 = await this._deviceModel.updateMany(
        {
          isActive: true,
          ip: { $nin: isDevicesInLibrenms },
          inLibrenms: true,
        },
        { $set: { inLibrenms: false } },
      );
      this.logger.debug(
        `🔁 inLibrenms true → false: matched=${r2.matchedCount}, modified=${r2.modifiedCount}`,
      );

      this.logger.debug(
        `LibreNMS - devices found: ${deviceFound}, not found: ${deviceNotFound}`,
      );
    } catch (error) {
      throw error;
    }

    const devicesToUpdate = [...r1DevicesToUpdate, ...r2DevicesToUpdate];
    if (devicesToUpdate.length > 0) {
      const devicesToQueue: string[] = devicesToUpdate.map((device) =>
        device._id.toString(),
      );

      await this.sendToRabbitMQByMapUUID(devicesToQueue, 'librenms');
    }
  }
*/
  /**
   * @description establece la conexión ssh al servidor
   * @returns Promise<void>
   */
  async sshConnection(): Promise<void> {
    return new Promise((resolve, reject) => {
      //CREAR UNA NUEVA INSTANCIA DEL CLIENTE SSH
      const sshClient = new Client();

      //CONFIGURAR LOS PARÁMETROS DE CONEXIÓN
      const connectionParams = {
        host: process.env.SSH_HOST,
        username: process.env.SSH_USER,
        privateKey: require('fs').readFileSync(
          path.join(process.cwd(), 'cert/id_rsa_unimus_programacion.cert'),
        ),
      };

      //CONECTARSE AL SERVIDOR SSH
      sshClient.connect(connectionParams);

      sshClient.on('ready', () => {
        //console.log('Connected via SSH!');
        this.logger.debug('Connected via SSH!');

        //NOW CAN EXECUTE COMMANDS, TRANSFER FILES, ETC.
        //OBTENER EL CONTENIDO DEL ARCHIVO /var/lib/bind/osnetpr.com.hosts
        sshClient.exec(
          'docker exec bind cat /var/lib/bind/osnetpr.com.hosts',
          (err, stream) => {
            if (err) {
              console.error('Error executing command:', err);
              return;
            }

            let fileContent = '';

            stream
              .on('close', (code, signal) => {
                //console.log(`Command finished with code: ${code}, signal: ${signal}`,);
                this.logger.debug(
                  `Command finished with code: ${code}, signal: ${signal}`,
                );

                const dataDir = path.join(__dirname, '..', 'data');

                //CREAR DIRECTORIO SI NO EXISTE
                if (!fs.existsSync(dataDir)) {
                  fs.mkdirSync(dataDir, { recursive: true });
                }

                //GUARDAR EL ARCHIVO TXT
                const txtPath = path.join(dataDir, 'osnetpr.com.hosts.txt');
                fs.writeFileSync(txtPath, fileContent, 'utf8');
                this.logger.debug(`Archivo TXT guardado en: ${txtPath}`);

                //PROCESAR PARA CREAR EL JSON
                this.processTxtToJson(dataDir, fileContent);

                //CLOSE THE SSH CONNECTION
                sshClient.end();
                resolve();
              })
              .on('data', (data) => {
                fileContent += data.toString();
                //console.log(`STDOUT: ${data}`);
              })
              .stderr.on('data', (data) => {
                //console.error(`STDERR: ${data}`);
                this.logger.error(`STDERR: ${data}`);
              });
          },
        );
      });

      sshClient.on('error', (err) => {
        this.logger.error('Error connecting via SSH:', err);
        reject(err);
      });
    });
  }

  /**
   * @description procesa el archivo txt a json, para obtener el dominio de cada IP
   * @param dataDir - directorio de datos
   * @param fileContent - contenido del archivo txt
   */
  processTxtToJson(dataDir: string, fileContent: string) {
    const jsonPath = path.join(dataDir, 'osnetpr.com.hosts.json');
    const dnsRecords = {};

    //EXPRESIÓN REGULAR MANEJA TABS Y ESPACIOS
    const regex =
      /^([^\s]+\.osnetpr\.com\.?)[\t\s]+(?:\d+[\t\s]+)?IN[\t\s]+A[\t\s]+(\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3})/gim;

    let match;
    while ((match = regex.exec(fileContent)) !== null) {
      const domain = match[1].replace(/\.$/, ''); //ELIMINAR PUNTO FINAL
      const ip = match[2];
      dnsRecords[ip] = domain;
    }

    if (Object.keys(dnsRecords).length === 0) {
      this.logger.warn('No se encontraron registros DNS válidos en el archivo');
      // Debug: Mostrar contenido completo para diagnóstico
      //this.logger.debug('Contenido completo del archivo:\n' + fileContent);
    } else {
      fs.writeFileSync(jsonPath, JSON.stringify(dnsRecords, null, 2), 'utf8');
      this.logger.debug(`Archivo JSON guardado en: ${jsonPath}`);
      this.logger.debug(
        `Registros encontrados en /var/lib/bind/osnetpr.com.hosts: ${Object.keys(dnsRecords).length}`,
      );
    }
  }

  /**
   * @description envía los dispositivos a la cola de RabbitMQ por el MapUUID
   * @param devicesId - ids de los dispositivos
   * @param type - tipo de dispositivo (unimus o librenms)
   * @returns void
   */
  async sendToRabbitMQByMapUUID(
    devicesId: string[],
    type: 'unimus' | 'librenms',
  ): Promise<void> {
    if (!devicesId.length) return;

    // console.log('ENTRO A ENVIAR A RABBIT');
    this.logger.debug(`Devices a actualizar ${type}, ${devicesId.length}`);

    //OBTENER LOS DISPOSITIVOS COMPLETOS CON SUS MapUUIDs
    const affectedDevices = await this._deviceModel
      .find({
        _id: { $in: devicesId },
      })
      .lean();

    const sendPromises = affectedDevices.flatMap((device) => {
      return device.MapUUID.map(async (mapUUID) => {
        const queueName = mapUUID.toString();

        try {
          //await this.channelWrapper.assertQueue(queueName, { durable: true });

          const message = {
            _id: device._id.toString(),
            NewStatus: device.StatusIcmp,
            MapUUID: [mapUUID.toString()],
            Type: type,
          };

          await this.channelWrapper.sendToQueue(queueName, message, {
            persistent: true,
          });

          //this.logger.debug(`RabbitMQ [${queueName}]: ${JSON.stringify(message)}`);
        } catch (error) {
          this.logger.error(
            `Error enviando mensaje a cola ${queueName}:`,
            error,
          );
        }
      });
    });

    await Promise.all(sendPromises);
    // this.logger.debug(
    //   `Eventos ${type} enviados a ${sendPromises.length} colas específicas`,
    // );
  }

  //EVERY_5_MINUTES
  //0 */5 * * * *
  /**
   * @description maneja el cron para verificar los dispositivos en Unimus y LibreNMS
   * @returns void
   */

  //@Cron('0 */5 * * * *')
  /*
  async handleCronInUnimusAndLibrenms() {
    this.logger.debug('Iniciando proceso cron...');
    const startTime = performance.now();
    await this.sshConnection();
    const endTime = performance.now();

    this.logger.debug(
      `Connection ssh completed - took ${endTime - startTime} milliseconds`,
    );

    const startTimeUnimus = performance.now();
    await this.isDevicesInUnimus();
    const endTimeUnimus = performance.now();

    this.logger.debug(
      `isDevicesInUnimus completed - took ${endTimeUnimus - startTimeUnimus} milliseconds`,
    );

    const startTimeLibrenms = performance.now();
    await this.isDevicesInLibrenms();
    const endTimeLibrenms = performance.now();
    this.logger.debug(
      `isDevicesInLibrenms completed - took ${endTimeLibrenms - startTimeLibrenms} milliseconds`,
    );
  }*/
}
