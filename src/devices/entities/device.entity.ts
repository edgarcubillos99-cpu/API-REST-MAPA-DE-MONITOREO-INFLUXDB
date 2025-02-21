import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose from 'mongoose';
import { Position } from 'src/common/entities/position.entity';
import { Mapa } from 'src/mapas/entities/mapa.entity';

@Schema({ timestamps: true })
export class Device {
  @Prop({ isRequired: true, unique: true })
  ip: string;

  @Prop()
  description: string;

  @Prop()
  make: string; // MikroTik, HPE, Ubiquiti, Cambium, Juniper, TpLink, ICT, TPDIN

  @Prop({ isRequired: true })
  name: string;

  @Prop({ type: Position, required: true, default: { x: 0, y: 0 } })
  position: Position;

  @Prop({ type: Boolean, default: true })
  isActive: boolean;

  @Prop({
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Mapa',
    required: true,
  })
  MapUUID: Mapa;

  @Prop({ isRequired: true })
  StatusIcmp: string;

  @Prop({ isRequired: true, default: 161 })
  portsnmp: number;

  @Prop({ type: Boolean })
  Status: boolean;

  @Prop({ type: String })
  community: string;

  @Prop({
    type: Object,
    default: {
      count: 8,
      intervall: 100,
      sumTimeOut: 1200,
      percentLostPackage: 70,
      sizePackage: 64,
    },
  })
  PingConfig: {
    count: number;
    intervall: number;
    sumTimeOut: number;
    percentLostPackage: number;
    sizePackage: number;
  };
}

export const DeviceSchema = SchemaFactory.createForClass(Device);
