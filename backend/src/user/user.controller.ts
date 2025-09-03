import { Body, Patch, Post, Delete, Req } from '@nestjs/common';
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

  // Mark a book as favourite
  @Post(':userId/favourites/:isbn')
  async addFavourite(@Param('userId') userId: string, @Param('isbn') isbn: string) {
    // Add ISBN to user's favourites (max 20)
    const user = await this.userModel.findById(userId);
    if (!user) return { error: 'User not found' };
    if (!user.favourites) user.favourites = [];
    if (user.favourites.includes(isbn)) return { ok: true, already: true };
    if (user.favourites.length >= 20) return { error: 'Max 20 favourites allowed' };
    user.favourites.push(isbn);
    await user.save();
    return { ok: true };
  }

  // Remove a book from favourites
  @Delete(':userId/favourites/:isbn')
  async removeFavourite(@Param('userId') userId: string, @Param('isbn') isbn: string) {
    const user = await this.userModel.findById(userId);
    if (!user) return { error: 'User not found' };
    if (!user.favourites) user.favourites = [];
    user.favourites = user.favourites.filter(fav => fav !== isbn);
    await user.save();
    return { ok: true };
  }

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
