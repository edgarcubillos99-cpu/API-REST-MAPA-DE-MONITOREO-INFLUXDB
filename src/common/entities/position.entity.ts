import { Prop } from '@nestjs/mongoose';

export class Position {
  @Prop({ type: String, default: 0 })
  x: string;

  @Prop({ type: String, default: 0 })
  y: string;
}
