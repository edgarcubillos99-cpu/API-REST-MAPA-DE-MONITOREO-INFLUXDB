import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose, { UpdateQuery } from 'mongoose';
import { DestinationEnlace } from './destination-enlace.entity';

@Schema({ timestamps: true })
export class Enlace {
  @Prop({ required: true })
  description: string;

  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'Device', required: true })
  DeviceOrigen: mongoose.Schema.Types.ObjectId;

  // @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'Device', required: true })
  // DeviceDestino: mongoose.Schema.Types.ObjectId;

  @Prop({ type: String })
  InterfaceOrigen: string; // nombre

  // @Prop({ type: String })
  // InterfaceDestino: string; // nombre

  @Prop({
    type: [{ type: mongoose.Schema.Types.ObjectId, ref: 'DestinationEnlace' }],
  })
  DevicesInterfacesDestination: DestinationEnlace[];

  @Prop({ type: String })
  tipoMedio: string; // 'Fiber Optic', 'Wireless', 'Cable'

  @Prop({ type: Number })
  idsnmp: number; // 1,2,3,4

  @Prop({ type: String, default: 'unknown' })
  lastStatus: string;

  @Prop({ type: Date, required: true, default: Date.now() })
  lastChangeStatusTime: Date;

  @Prop({
    type: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Mapa' }],
    default: [new mongoose.Types.ObjectId('67b38c15cf3716cedc9da393')],
  })
  MapUUID: mongoose.Types.ObjectId[];

  @Prop({ type: Boolean, default: true })
  isActive: boolean;
}

export const EnlaceSchema = SchemaFactory.createForClass(Enlace);

/* eslint-disable @typescript-eslint/no-unsafe-argument */
EnlaceSchema.pre('updateOne', async function (next) {
  const update = this.getUpdate() as UpdateQuery<Enlace>;
  const updatelastStatus = update?.lastStatus ?? update?.$set?.lastStatus;

  //SI NO SE INTENTA CAMBIAR laststatus, SALIR
  if (!updatelastStatus) return next();

  //OBTENER EL DOCUMENTO ACTUAL
  const current = await this.model.findOne(this.getQuery());

  //SI NO SE ENCUENTRA EL DOCUMENTO, SALIR
  if (!current) return next();

  //COMPARAR EL VALOR ACTUAL CON EL NUEVO
  if (current.lastStatus !== updatelastStatus) {
    //ASIGNAR NUEVA FECHA
    if (!update.$set) update.$set = {};
    update.$set.lastChangeStatusTime = Date.now();
  }

  next();
});
