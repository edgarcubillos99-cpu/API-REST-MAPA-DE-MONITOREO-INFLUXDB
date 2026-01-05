import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose from 'mongoose';
import { Position } from 'src/common/entities/position.entity';
import { Mapa } from 'src/mapas/entities/mapa.entity';

@Schema({ timestamps: true })
export class Label {
  @Prop({ required: false })
  description: string;

  @Prop({ required: true })
  body: string;

  @Prop({ type: Position, required: true, default: { x: 0, y: 0 } })
  position: Position;

  @Prop({
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Mapa',
    required: true,
  })
  mapa: Mapa;
}

export const LabelSchema = SchemaFactory.createForClass(Label);
