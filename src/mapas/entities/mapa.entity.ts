import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose from 'mongoose';
import { Position } from 'src/common/entities/position.entity';
import { Device } from 'src/devices/entities/device.entity';

export class AmountStatusDevicesSnmp {
  @Prop({ type: Number, default: 0 })
  up: number;

  @Prop({ type: Number, default: 0 })
  down: number;
}

@Schema({ timestamps: true })
export class Mapa {
  @Prop({ isRequired: true, unique: true })
  name: string;

  @Prop()
  latitude: string;

  @Prop()
  longitude: string;

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

  @Prop({
    type: AmountStatusDevicesSnmp,
    required: true,
    default: { up: 0, down: 0 },
  })
  AmountStatusDevicesSnmp: AmountStatusDevicesSnmp;
}

export const MapaSchema = SchemaFactory.createForClass(Mapa);
