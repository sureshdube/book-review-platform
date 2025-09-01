

import { Controller, Get, Param, Post, Query, Body, Patch, Delete } from '@nestjs/common';
import { BookService } from './book.service';
import { ReviewService } from './review.service';

@Controller('books')
export class BookController {
  constructor(
    private readonly bookService: BookService,
    private readonly reviewService: ReviewService,
  ) {}

  // Get all reviews for a book
  // Edit a review (user can only edit their own review)
  @Patch(':isbn/reviews/:reviewId')
  async updateReview(
    @Param('isbn') isbn: string,
    @Param('reviewId') reviewId: string,
    @Body() body: { rating?: number; text?: string; user: string },
  ) {
    return this.reviewService.updateReview(isbn, reviewId, body.user, body.rating, body.text);
  }

  // Delete a review (user can only delete their own review)
  @Delete(':isbn/reviews/:reviewId')
  async deleteReview(
    @Param('isbn') isbn: string,
    @Param('reviewId') reviewId: string,
    @Body() body: { user: string },
  ) {
    return this.reviewService.deleteReview(isbn, reviewId, body.user);
  }
  @Get(':isbn/reviews')
  async getReviews(@Param('isbn') isbn: string) {
    return this.reviewService.getReviewsForBook(isbn);
  }

  // Create a review for a book (requires auth)
  @Post(':isbn/reviews')
  async createReview(
    @Param('isbn') isbn: string,
    @Body() body: { rating: number; text?: string; user: string; userEmail: string },
  ) {
    // In a real app, get user/userEmail from JWT, here from body for MVP simplicity
    return this.reviewService.createReview(isbn, body.user, body.userEmail, body.rating, body.text);
  }

  // Add default books if cache is empty
  @Post('seed-defaults')
  async seedDefaults() {
    return this.bookService.seedDefaultBooks();
  }

  @Get()
  async getAllBooks(
    @Query('page') page: string = '1',
    @Query('limit') limit: string = '20',
    @Query('q') q?: string,
  ) {
    // Parse and validate
    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.max(1, parseInt(limit, 10) || 20);
    return this.bookService.getPaginatedBooks(pageNum, limitNum, q);
  }

  @Get(':isbn')
  async getBook(@Param('isbn') isbn: string) {
    return this.bookService.fetchAndCacheBook(isbn);
  }

  @Post('refresh')
  async refreshAll() {
    const updated = await this.bookService.refreshAllBooks();
    return { updated };
  }
}
