import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose from 'mongoose';

@Schema({ timestamps: true })
export class DestinationEnlace {
  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'Device', required: true })
  DeviceDestino: mongoose.Schema.Types.ObjectId;

  @Prop({ type: String, required: true })
  InterfaceDestino: string;

  @Prop({ type: Boolean, default: true })
  isActive: boolean;
}

export const DestinationEnlaceSchema =
  SchemaFactory.createForClass(DestinationEnlace);
