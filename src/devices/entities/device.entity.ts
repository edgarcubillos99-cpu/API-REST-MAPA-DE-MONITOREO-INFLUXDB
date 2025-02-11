import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose from 'mongoose';
import { Position } from 'src/common/entities/position.entity';
import { Mapa } from 'src/mapas/entities/mapa.entity';

@Schema({ timestamps: true })
export class Device {
  @Prop({ isRequired: true, unique: true })
  ip: string;

  @Prop()
  descripcion: string;

  @Prop({ isRequired: true })
  nombre: string;

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

  @Prop({ type: Boolean})
  Status: boolean;
}

export const DeviceSchema = SchemaFactory.createForClass(Device);
