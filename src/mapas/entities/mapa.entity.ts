import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose from 'mongoose';
import { Position } from 'src/common/entities/position.entity';
import { Device } from 'src/devices/entities/device.entity';

@Schema({ timestamps: true })
export class Mapa {
  @Prop({ isRequired: true, unique: true })
  nombre: string;

  @Prop()
  latitud: string;

  @Prop()
  longitud: string;

  @Prop({ type: Position, required: true, default: { x: 0, y: 0 } })
  position: Position;

  @Prop({ type: Boolean, default: true })
  isActive: boolean;

  @Prop({
    type: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Device' }],
  })
  Devices: Device[];

  @Prop({ type: Number, default: 0 })
  AmountDevices: number;

  @Prop({ isRequired: true })
  StatusDevices: string;
}

export const MapaSchema = SchemaFactory.createForClass(Mapa);
