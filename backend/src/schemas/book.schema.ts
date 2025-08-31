import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema({ timestamps: true })
export class Book {
  @Prop({ required: true, unique: true })
  isbn: string;

  @Prop({ required: true })
  title: string;

  @Prop()  // Optional
  authors?: string[];

  @Prop()
  cover?: string;

  @Prop({ type: Object })
  data?: Record<string, any>; // Raw Open Library data
}

export type BookDocument = Book & Document;
export const BookSchema = SchemaFactory.createForClass(Book);
