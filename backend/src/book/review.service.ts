
import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Review, ReviewDocument } from '../schemas/review.schema';
import { Book, BookDocument } from '../schemas/book.schema';

@Injectable()
export class ReviewService {
  constructor(
    @InjectModel(Review.name) private reviewModel: Model<ReviewDocument>,
    @InjectModel(Book.name) private bookModel: Model<BookDocument>,
  ) {}

  async createReview(isbn: string, userId: string, userEmail: string, rating: number, text?: string) {
    // Check if book exists
    const book = await this.bookModel.findOne({ isbn });
    if (!book) throw new BadRequestException('Book not found');
    // Only one review per user per book
    const existing = await this.reviewModel.findOne({ isbn, user: userId });
    if (existing) throw new BadRequestException('You have already reviewed this book');
    // Create review
    const review = await this.reviewModel.create({
      isbn,
      user: userId,
      userEmail,
      rating,
      text,
    });
    return review;
  }

  async getReviewsForBook(isbn: string) {
    return this.reviewModel.find({ isbn }).sort({ createdAt: -1 }).lean();
  }
  async updateReview(isbn: string, reviewId: string, userId: string, rating?: number, text?: string) {
    const review = await this.reviewModel.findOne({ _id: reviewId, isbn, user: userId });
    if (!review) throw new BadRequestException('Review not found or not owned by user');
    if (rating !== undefined) review.rating = rating;
    if (text !== undefined) review.text = text;
    await review.save();
    return review;
  }

  async deleteReview(isbn: string, reviewId: string, userId: string) {
    const review = await this.reviewModel.findOneAndDelete({ _id: reviewId, isbn, user: userId });
    if (!review) throw new BadRequestException('Review not found or not owned by user');
    return { deleted: true };
  }
}
