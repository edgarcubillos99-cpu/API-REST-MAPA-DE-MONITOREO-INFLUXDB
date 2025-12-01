import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import * as bcrypt from 'bcrypt';
import { UpdateQuery } from 'mongoose';

@Schema({ timestamps: true })
export class User {
  @Prop({ required: true })
  firstName: string;

  @Prop({ required: true })
  lastName: string;

  @Prop({ lowercase: true, required: true, unique: true })
  email: string;

  @Prop({ type: Boolean, default: true })
  isActive: boolean;

  @Prop({ required: true, select: false })
  password: string;
}

export const UserSchema = SchemaFactory.createForClass(User);

UserSchema.pre('save', async function (next) {
  // COMPRUEBA SI LA PASSWORD HA SIDO MODIFICADA
  if (!this.isModified('password')) return next();

  // GENERAR HASH DE LA PASSWORD
  this.password = await bcrypt.hash(this.password, 13);

  next();
});

/* eslint-disable @typescript-eslint/no-unsafe-argument */
UserSchema.pre('updateOne', async function (next) {
  const update = this.getUpdate() as UpdateQuery<User>;

  if (update?.password) {
    update.password = await bcrypt.hash(update.password, 13);
  }

  next();
});
