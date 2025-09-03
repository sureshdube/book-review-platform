import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema({ collection: 'config', timestamps: true })
export class Config {
  @Prop({ required: true, unique: true })
  key: string;

  @Prop({ required: true })
  value: string;
}

export type ConfigDocument = Config & Document;
export const ConfigSchema = SchemaFactory.createForClass(Config);
