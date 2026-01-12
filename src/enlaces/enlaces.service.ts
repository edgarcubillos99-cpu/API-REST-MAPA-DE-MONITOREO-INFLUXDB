import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateEnlaceDto } from './dto/create-enlace.dto';
import { UpdateEnlaceDto } from './dto/update-enlace.dto';
import { Enlace } from './entities/enlace.entity';
import { CommonService } from 'src/common/common.service';
import { InjectConnection, InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { PaginationDto } from 'src/common/dto/pagination.dto';
import { formatMacAddress } from 'src/common/utils/format-macaddress.util';
import { DestinationEnlace } from './entities/destination-enlace.entity';
import mongoose from 'mongoose';
var snmp = require('net-snmp');

@Injectable()
export class EnlacesService {
  constructor(
    @InjectModel(Enlace.name) private _enlaceModel: Model<Enlace>,
    @InjectModel(DestinationEnlace.name)
    private _destinationEnlaceModel: Model<DestinationEnlace>,
    private readonly commonService: CommonService,
    @InjectConnection() private readonly connection: mongoose.Connection,
  ) {}

  async create(createEnlaceDto: CreateEnlaceDto) {
    const session = await this.connection.startSession();
    session.startTransaction();

    try {
      // CREAR LAS INSTANCIAS DE DestinationEnlace Y OBTENER SUS _id
      const destinationEnlaces = await this._destinationEnlaceModel.insertMany(
        createEnlaceDto.DevicesInterfacesDestination.map((device) => ({
          DeviceDestino: new mongoose.Types.ObjectId(device.DeviceDestino),
          InterfaceDestino: device.InterfaceDestino,
        })),
        { session },
      );

      // CREAR EL ENLACE CON LOS ObjectId DE LOS DestinationEnlace
      const enlace = await this._enlaceModel.create(
        [
          {
            ...createEnlaceDto,
            DevicesInterfacesDestination: destinationEnlaces.map((d) => d._id), // SOLO PASAMOS LOS _id
          },
        ],
        { session },
      );

      // CONFIRMANDO LA TRANSACCION
      await session.commitTransaction();

      return enlace[0];
    } catch (error) {
      this.commonService.handleExceptions(error);
      // ABORTANDO TODOS LOS CAMBIOS A BASE DE DATOS
      session.abortTransaction();
    } finally {
      await session.endSession();
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
    const session = await this.connection.startSession();
    session.startTransaction();

    try {
      const enlace = await this.findById(id);

      // SI SE PASA EL CAMPO DEVICESINTERFACESDESTINATION
      if (updateEnlaceDto.DevicesInterfacesDestination) {
        // 1. ELIMINA LOS ENLACES DE DESTINO ANTIGUOS
        const oldDestinationEnlaces = enlace.DevicesInterfacesDestination;

        if (oldDestinationEnlaces.length > 0) {
          await this._destinationEnlaceModel.updateMany(
            { _id: { $in: oldDestinationEnlaces } },
            { isActive: false },
            { session },
          );

          // ELIMINA LAS REFERENCIAS DEL ENLACE
          await this._enlaceModel.updateOne(
            { _id: enlace._id },
            {
              $pull: {
                DevicesInterfacesDestination: { $in: oldDestinationEnlaces },
              },
            },
            { session },
          );
        }

        // 2. CREAR NUEVOS ENLACES DE DESTINO Y OBTENER SUS _id
        const newDestinationEnlaces =
          await this._destinationEnlaceModel.insertMany(
            updateEnlaceDto.DevicesInterfacesDestination?.map((device) => ({
              DeviceDestino: new mongoose.Types.ObjectId(device.DeviceDestino),
              InterfaceDestino: device.InterfaceDestino,
            })),
            { session },
          );

        // 3. ACTUALIZAR EL ENLACE CON LAS NUEVAS REFERENCIAS
        const newDestinationIds = newDestinationEnlaces.map((d) => d._id);

        await this._enlaceModel.updateOne(
          { _id: enlace._id },
          {
            $set: {
              ...updateEnlaceDto,
              DevicesInterfacesDestination: newDestinationIds,
            },
          },
          { session },
        );
      } else {
        await this._enlaceModel.updateOne(
          { _id: id },
          { $set: updateEnlaceDto },
          { session },
        );
      }

      // CONFIRMANDO LA TRANSACCION
      await session.commitTransaction();

      return await this.findById(id);
    } catch (error) {
      this.commonService.handleExceptions(error);
      // ABORTANDO TODOS LOS CAMBIOS A BASE DE DATOS
      await session.abortTransaction();
    } finally {
      await session.endSession();
    }
  }

  async remove(id: string) {
    const session = await this.connection.startSession();
    session.startTransaction();

    try {
      const enlace = await this.findById(id);

      const destinationEnlaces = enlace.DevicesInterfacesDestination;

      // ACTUALIZANDO MapUUID y DevicesDestination ELEMENTOS DEL ARREGLO
      await this._enlaceModel.updateOne(
        { _id: enlace._id },
        {
          $pullAll: {
            DevicesInterfacesDestination: destinationEnlaces,
            MapUUID: enlace.MapUUID,
          },
        },
        { session },
      );

      // ELIMINADO EL ENLACE ENCONTRADO
      await enlace.updateOne({ isActive: false }, { session });

      await this._destinationEnlaceModel.updateMany(
        { _id: { $in: destinationEnlaces } },
        { isActive: false },
        { session },
      );

      // CONFIRMANDO LA TRANSACCION
      await session.commitTransaction();

      return `Enlace ${enlace._id} Delete!`;
    } catch (error) {
      this.commonService.handleExceptions(error);
      // ABORTANDO TODOS LOS CAMBIOS A BASE DE DATOS
      session.abortTransaction();
    } finally {
      await session.endSession();
    }
  }

 async snmpQuerySubtreeSimple(ip: string, communityEntry?: string) {
    const community = communityEntry || 'osnsnmpro';
    const session = await snmp.createSession(ip, community, {
      version: snmp.Version2c,
      timeout: 1000,
    });

    const ifDescrOID = '1.3.6.1.2.1.2.2.1.2';

    function feedCb(varbinds) {
      varbinds.forEach((vb) => {
        if (snmp.isVarbindError(vb)) {
          console.error(`Error con OID ${vb.oid}: ${snmp.varbindError(vb)}`);
        } else {
          console.log(`OID: ${vb.oid} -> Interface: ${vb.value.toString()}`);
        }
      });
    }

    function doneCb(error) {
      if (error) {
        console.error(`Error en la operación SNMP: ${error.toString()}`);
      } else {
        console.log('Operación SNMP completada exitosamente.');
      }
      session.close();
    }

    const maxRepetitions = 20;
    session.subtree(ifDescrOID, maxRepetitions, feedCb, doneCb);

    session.on('error', (error) => {
      console.error(`Error en la sesión SNMP: ${error.toString()}`);
    });
  }

  snmpQuerySubtree(ip: string, communityEntry?: string): Promise<any[]> {
    return new Promise((resolve, reject) => {
      const community = communityEntry || 'osnsnmpro';
      const session = snmp.createSession(ip, community, {
        version: snmp.Version2c,
        timeout: 1000,
      });

      const oids = {
        ifDescr: '1.3.6.1.2.1.2.2.1.2', // Nombre de la interfaz
        ifPhysAddress: '1.3.6.1.2.1.2.2.1.6', // Dirección MAC
        ifMtu: '1.3.6.1.2.1.2.2.1.4', // MTU
        ifOperStatus: '1.3.6.1.2.1.2.2.1.8', // Estado de la interfaz
        modulationSpeed: '1.3.6.1.2.1.31.1.1.1.15', // OID de velocidad de modulación (Mbps)
        ifAlias: '1.3.6.1.2.1.31.1.1.1.18', // Alias o descripcion de la interfaz
      };

      const interfaces: Record<string, any> = {};
      let completedWalks = 0; // Contador de OIDs completados

      function subtreeOid(oid: string, key: string) {
        session.subtree(
          oid,
          20,
          (varbinds) => {
            varbinds.forEach((vb) => {
              if (snmp.isVarbindError(vb)) {
                console.error(`Error con OID ${oid}: ${snmp.varbindError(vb)}`);
              } else {
                const ifIndex = vb.oid.split('.').pop();

                if (ifIndex) {
                  if (!interfaces[ifIndex]) {
                    interfaces[ifIndex] = {
                      idsnmp: parseInt(ifIndex, 10),
                    };
                  }

                  // ASIGNAR VALORES CON NOMBRES PERSONALIZADOS
                  switch (key) {
                    case 'ifPhysAddress':
                      interfaces[ifIndex]['macaddress'] =
                        vb.value instanceof Buffer
                          ? formatMacAddress(vb.value)
                          : vb.value.toString();
                      break;
                    case 'ifDescr':
                      interfaces[ifIndex]['name'] = vb.value.toString();
                      break;
                    case 'ifMtu':
                      interfaces[ifIndex]['mtu'] = vb.value;
                      break;
                    case 'ifOperStatus':
                      interfaces[ifIndex]['status'] = vb.value;
                      break;
                    case 'modulationSpeed':
                      interfaces[ifIndex]['modulationspeed'] = vb.value; // Ya está en Mbps
                      break;
                    case 'ifAlias':
                      const aliasValue =
                        vb.value instanceof Buffer
                          ? vb.value.toString().trim()
                          : String(vb.value).trim();
                      interfaces[ifIndex]['description'] = aliasValue || '';
                      break;
                  }
                }
              }
            });
          },
          () => {
            completedWalks++;
            if (completedWalks === Object.keys(oids).length) {
              session.close();
              const result = Object.values(interfaces);
              resolve(result);
            }
          },
        );
      }

      // EJECUTAR subtree PARA CADA OID
      Object.entries(oids).forEach(([key, oid]) => {
        subtreeOid(oid, key);
      });

      session.on('error', (error) => {
        reject(`Error en la sesión SNMP: ${error.toString()}`);
      });
    });
  }
}
