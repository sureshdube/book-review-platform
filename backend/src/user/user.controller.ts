import { Controller, Get, Param } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User, UserDocument } from '../schemas/user.schema';
import { Review, ReviewDocument } from '../schemas/review.schema';
import { Book, BookDocument } from '../schemas/book.schema';

@Controller('users')
export class UserController {
  constructor(
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    @InjectModel(Review.name) private reviewModel: Model<ReviewDocument>,
    @InjectModel(Book.name) private bookModel: Model<BookDocument>,
  ) {}

  @Get(':userId/profile')
  async getProfile(@Param('userId') userId: string) {
    // Get user
    const user = await this.userModel.findById(userId).lean();
    if (!user) return { error: 'User not found' };
    // Get reviews
    const reviews = await this.reviewModel.find({ user: userId }).sort({ createdAt: -1 }).lean();
    // Get favourites (up to 20)
    const favIsbns = user.favourites || [];
    const favourites = favIsbns.length
      ? await this.bookModel.find({ isbn: { $in: favIsbns } }).lean()
      : [];
    // Attach book title to reviews
    const bookMap = new Map();
    favourites.forEach(b => bookMap.set(b.isbn, b.title));
    reviews.forEach(r => { (r as any).bookTitle = bookMap.get(r.isbn) || r.isbn; });
    return { user, reviews, favourites };
  }
}
