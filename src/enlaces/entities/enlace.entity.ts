import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose from 'mongoose';
import { Mapa } from 'src/mapas/entities/mapa.entity';

@Schema({ timestamps: true })
export class Enlace {
  @Prop({ isRequired: true })
  description: string;

  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'Device', required: true })
  DeviceOrigen: mongoose.Schema.Types.ObjectId;

  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'Device', required: true })
  DeviceDestino: mongoose.Schema.Types.ObjectId;

  @Prop({ type: String })
  InterfaceOrigen: string; // nombre

  @Prop({ type: String })
  InterfaceDestino: string; // nombre

  @Prop({ type: String })
  tipoMedio: string; // 'Fiber Optic', 'Wireless', 'Cable'  //ingles

  @Prop({ type: Number })
  idsnmp: number; // 1,2,3,4

  @Prop({ type: String, default: 'none' })
  lastStatus: string;

  @Prop({
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Mapa',
    required: true,
    default: '67b38c15cf3716cedc9da393',
  })
  MapUUID: Mapa;

  @Prop({ type: Boolean, default: true })
  isActive: boolean;
}

export const EnlaceSchema = SchemaFactory.createForClass(Enlace);
