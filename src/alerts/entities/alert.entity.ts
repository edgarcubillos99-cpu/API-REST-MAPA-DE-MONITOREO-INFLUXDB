import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose from 'mongoose';
import { Device } from 'src/devices/entities/device.entity';

@Schema({ timestamps: true })
export class Alert {
  @Prop({ isRequired: false })
  description: string;

  @Prop({ isRequired: true })
  oid: string;

  @Prop({ isRequired: true })
  operator: string; //>, <, =, !=, >=, <=

  @Prop({
    type: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Device' }],
  })
  devices: Device[];

  @Prop({ isRequired: true, default: 0 })
  countAlerts: number;

  @Prop({ isRequired: true, default: 1 })
  maxNumAlerts: number;

  @Prop({ isRequired: true })
  delay: string; //1s, 1m, 1h, 1d

  @Prop({ isRequired: true, type: Date, default: Date.now() })
  lastAlert: Date;

  @Prop({ isRequired: true })
  severity: string;
}

export const AlertSchema = SchemaFactory.createForClass(Alert);
