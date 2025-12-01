import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose from 'mongoose';
import { Device } from 'src/devices/entities/device.entity';

@Schema({ timestamps: true })
export class Alert {
  @Prop({ required: false })
  description: string;

  @Prop({ required: true })
  oid: string;

  @Prop({ required: true })
  operator: string; //>, <, =, !=, >=, <=

  @Prop({
    type: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Device' }],
  })
  devices: Device[];

  @Prop({ required: true, default: 0 })
  countAlerts: number;

  @Prop({ required: true, default: 1 })
  maxNumAlerts: number;

  @Prop({ required: true })
  delay: string; //1s, 1m, 1h, 1d

  @Prop({ required: true, type: Date, default: Date.now() })
  lastAlert: Date;

  @Prop({ required: true })
  severity: string;

  @Prop({ required: true, default: true })
  isActiveAlert: boolean;

  @Prop({ required: false, default: 0 })
  value: number;

  @Prop({ required: false, default: '' })
  alert: string;

  @Prop({ required: false, default: '' })
  iconAlert: string;

  @Prop({ required: false, default: '' })
  colorAlert: string;
}

export const AlertSchema = SchemaFactory.createForClass(Alert);
