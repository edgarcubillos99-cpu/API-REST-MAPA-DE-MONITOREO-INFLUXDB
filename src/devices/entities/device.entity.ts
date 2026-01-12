import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose from 'mongoose';
import { Position } from 'src/common/entities/position.entity';

export class SnmpSettings {
  @Prop({ type: String, default: 'UDP' })
  protocol: string;

  @Prop({ type: Number, default: 161 })
  port: number;

  @Prop({ type: String, default: 'osnsnmpro' })
  community: string;
}

@Schema({ timestamps: true })
export class Device {
  @Prop({ required: true, unique: true })
  ip: string;

  @Prop()
  description: string;

  @Prop()
  make: string; // MikroTik, HPE, Ubiquiti, Cambium, Juniper, TpLink, ICT, TPDIN

  @Prop({ required: true })
  name: string;

  @Prop({ type: Position, required: true, default: { x: 0, y: 0 } })
  position: Position;

  @Prop({ type: Boolean, default: true })
  isActive: boolean;

  @Prop({
    type: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Mapa' }],
    required: true,
  })
  MapUUID: mongoose.Types.ObjectId[];

  @Prop({ required: true, default: 'unknown' })
  StatusIcmp: string;

  @Prop({ required: true, default: 'OTHER' })
  Type: string;

  @Prop({ type: Boolean })
  Status: boolean;

  @Prop({ type: Date, required: true, default: Date.now() })
  lastChangeStatusTime: Date;

  @Prop({
    type: SnmpSettings,
    required: true,
    default: { protocol: 'UDP', port: 161, community: 'osnsnmpro' },
  })
  SnmpSettings: SnmpSettings;

  @Prop({ type: Boolean, default: false })
  inUnimus: boolean;

  @Prop({ type: Boolean, default: false })
  inLibrenms: boolean;

  @Prop({
    type: Object,
    default: {
      count: 8,
      intervall: 10,
      sumTimeOut: 900,
      percentLostPackage: 70,
      sizePackage: 64,
    },
  })
  PingConfig: {
    count: number;
    intervall: number;
    sumTimeOut: number;
    percentLostPackage: number;
    sizePackage: number;
  };

  @Prop({ type: String, default: null })
  ubersmithTicketId: string;

  @Prop({ type: [String], default: [] })
  listTicketsUbersmith: string[];

}

export const DeviceSchema = SchemaFactory.createForClass(Device);

DeviceSchema.virtual('enlaces', {
  ref: 'Enlace',
  localField: '_id',
  foreignField: 'DeviceOrigen',
});

DeviceSchema.set('toObject', { virtuals: true });
DeviceSchema.set('toJSON', {
  virtuals: true,
  versionKey: false,
  transform: function (doc, ret) {
    if ('id' in ret) {
      delete ret.id;
    }
  },
});
