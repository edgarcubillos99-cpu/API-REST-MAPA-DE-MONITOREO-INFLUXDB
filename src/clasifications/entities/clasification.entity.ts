import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';

@Schema({ timestamps: true })
export class Clasification {
  @Prop({ required: true, unique: true })
  name: string;

  @Prop({ type: String, default: null })
  description: string;

  @Prop({ type: String, default: '#3B82F6' })
  color: string;

  @Prop({ type: Boolean, default: true })
  isActive: boolean;
}

export const ClasificationSchema = SchemaFactory.createForClass(Clasification);
