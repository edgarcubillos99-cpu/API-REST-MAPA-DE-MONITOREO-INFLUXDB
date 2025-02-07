import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';

@Schema({ timestamps: true })
export class User {
  @Prop({ isRequired: true })
  nombre: string;

  @Prop({ isRequired: true })
  apellido: string;

  @Prop({ lowercase: true, required: true, unique: true })
  email: string;

  @Prop({ type: Boolean, default: true })
  isActive: boolean;

  @Prop({ required: true })
  password: string;
}

export const UserSchema = SchemaFactory.createForClass(User);
