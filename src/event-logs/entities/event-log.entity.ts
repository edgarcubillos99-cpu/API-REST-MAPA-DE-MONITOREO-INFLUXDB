import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose from 'mongoose';
import { Device } from 'src/devices/entities/device.entity';

export class StatusTransitionSchema {
  @Prop({ type: String, required: true })
  from: string;

  @Prop({ type: String, required: true })
  to: string;
}

@Schema({ timestamps: true })
export class EventLog {
  @Prop({
    type: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Device' }],
    required: true,
  })
  devices: Device[];

  @Prop({ type: String, default: 'down' })
  Status: string; //up, down

  @Prop({ type: StatusTransitionSchema })
  StatusTransition?: {
    from: string;
    to: string;
  };

  @Prop({ type: Date, required: true })
  changedAt: Date;

  //"HH:mm:ss.SSS"
  //'00:00:00.000';
  @Prop({ type: String, required: true, default: '00:00:00.000' })
  Time: string;

  @Prop({ type: String, default: null })
  logType?: string;

  @Prop({ type: String, default: null })
  message?: string;
}

export const EventLogSchema = SchemaFactory.createForClass(EventLog);
