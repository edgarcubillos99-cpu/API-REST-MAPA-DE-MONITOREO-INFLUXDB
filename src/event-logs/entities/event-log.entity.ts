import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose from 'mongoose';

@Schema({ timestamps: true })
export class EventLog {
  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'Device', required: true })
  deviceId: mongoose.Types.ObjectId;

  @Prop({ type: String, default: 'down' })
  StatusIcmp: string; //up, down

  @Prop({ type: Date, required: true })
  changedAt: Date;

  //"HH:mm:ss.SSS"
  //'00:00:00.000'; 
  @Prop({ type: String, required: true, default: '00:00:00.000' })
  Time: string; 
}

export const EventLogSchema = SchemaFactory.createForClass(EventLog);
