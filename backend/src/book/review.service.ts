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
}
