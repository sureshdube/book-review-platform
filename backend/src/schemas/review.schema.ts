import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

@Schema({ timestamps: true })
export class Review {
  @Prop({ type: String, required: true })
  isbn: string; // Book ISBN

  @Prop({ type: String, required: true })
  user: string; // User ID (string for MVP)

  @Prop({ type: String })
  userEmail: string; // For display, denormalized

  @Prop({ type: Number, min: 1, max: 5, required: true })
  rating: number;

  @Prop({ type: String, maxlength: 2000 })
  text?: string;
}

export type ReviewDocument = Review & Document;
export const ReviewSchema = SchemaFactory.createForClass(Review);
