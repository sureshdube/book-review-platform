
import { Controller, Get, Param, Post } from '@nestjs/common';
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
  async getAllBooks() {
    // Return all cached books
    return this.bookService.getAllBooks();
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
