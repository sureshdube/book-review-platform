
import { Controller, Get, Param, Post, Query } from '@nestjs/common';
import { BookService } from './book.service';

@Controller('books')
export class BookController {
  constructor(private readonly bookService: BookService) {}

  // Add default books if cache is empty
  @Post('seed-defaults')
  async seedDefaults() {
    return this.bookService.seedDefaultBooks();
  }


  @Get()
  async getAllBooks(
    @Query('page') page: string = '1',
    @Query('limit') limit: string = '20',
  ) {
    // Parse and validate
    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.max(1, parseInt(limit, 10) || 20);
    return this.bookService.getPaginatedBooks(pageNum, limitNum);
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
