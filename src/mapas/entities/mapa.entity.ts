import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose from 'mongoose';
import { Clasification } from 'src/clasifications/entities/clasification.entity';
import { Position } from 'src/common/entities/position.entity';
import { Device } from 'src/devices/entities/device.entity';

export class AmountStatusDevicesSnmp {
  @Prop({ type: Number, default: 0 })
  up: number;

  @Prop({ type: Number, default: 0 })
  down: number;

  @Prop({ type: Number, default: 0 })
  unknown: number;

  @Prop({ type: Number, default: 0 })
  verified: number;
}

@Schema({ timestamps: true })
export class Mapa {
  @Prop({ required: true, unique: true })
  name: string;

  @Prop({ required: false, default: '0' })
  latitude: string;

  @Prop({ required: false, default: '0' })
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

  @Prop({ required: true, default: 'unknown' })
  StatusDevices: string;

  @Prop({
    type: AmountStatusDevicesSnmp,
    required: true,
    default: { up: 0, down: 0, unknown: 0, verified: 0 },
  })
  AmountStatusDevicesSnmp: AmountStatusDevicesSnmp;

  @Prop({
    type: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Mapa' }],
  })
  mapsInternal: Mapa[];

  @Prop({ type: Number, default: 0 })
  amountSubmaps: number;

  @Prop({ required: true, default: 'unknown' })
  statusSubmaps: string;

  @Prop({ required: true, default: true })
  lock: boolean;

  @Prop({ type: String, default: null })
  ubersmithTicketId: string;

  @Prop({ type: [String], default: [] })
  listTicketsUbersmith: string[];

  @Prop({
    type: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Clasification' }],
    default: [],
  })
  classifications: Clasification[];

}

export const MapaSchema = SchemaFactory.createForClass(Mapa);
