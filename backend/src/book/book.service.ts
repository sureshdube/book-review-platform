import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Book, BookDocument } from '../schemas/book.schema';
import axios from 'axios';

@Injectable()
export class BookService {
  // Return paginated books with rating stats for each book
  async getPaginatedBooksWithStats(page: number, limit: number, q?: string) {
    const skip = (page - 1) * limit;
    let filter = {};
    if (q && q.trim()) {
      const regex = new RegExp(q.trim(), 'i');
      filter = {
        $or: [
          { title: regex },
          { authors: regex },
        ],
      };
    }
    const [books, total] = await Promise.all([
      this.bookModel.find(filter).skip(skip).limit(limit).lean(),
      this.bookModel.countDocuments(filter),
    ]);
    // For each book, get stats
    const statsArr = await Promise.all(
      books.map(async b => {
        const [agg] = await this.bookModel.db.collection('reviews').aggregate([
          { $match: { isbn: b.isbn } },
          { $group: { _id: null, avg: { $avg: '$rating' }, count: { $sum: 1 } } },
        ]).toArray();
        return {
          avgRating: agg?.avg ? Number(agg.avg.toFixed(1)) : null,
          reviewCount: agg?.count || 0,
        };
      })
    );
    const booksWithStats = books.map((b, i) => ({ ...b, ratingStats: statsArr[i] }));
    return {
      books: booksWithStats,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }
  private readonly logger = new Logger(BookService.name);
  constructor(
    @InjectModel(Book.name) private bookModel: Model<BookDocument>,
  ) {}



  async fetchAndCacheBook(isbn: string): Promise<BookDocument> {
    // Try cache first
    let book = await this.bookModel.findOne({ isbn });
    if (book) return book;
    // Fetch from Open Library
    const url = `https://openlibrary.org/isbn/${isbn}.json`;
    try {
      const { data } = await axios.get(url);
      book = await this.bookModel.create({
        isbn,
        title: data.title,
        authors: data.authors?.map((a: any) => a.name || a.key) || [],
        cover: data.covers ? `https://covers.openlibrary.org/b/id/${data.covers[0]}-L.jpg` : undefined,
        data,
      });
      return book;
    } catch (e) {
      this.logger.error(`Failed to fetch book for ISBN ${isbn}: ${e}`);
      throw e;
    }
  }

  async getBook(isbn: string): Promise<BookDocument | null> {
    return this.bookModel.findOne({ isbn });
  }

  async refreshAllBooks(): Promise<number> {
    const books = await this.bookModel.find();
    let updated = 0;
    for (const book of books) {
      try {
        const url = `https://openlibrary.org/isbn/${book.isbn}.json`;
        const { data } = await axios.get(url);
        await this.bookModel.updateOne({ isbn: book.isbn }, {
          $set: {
            title: data.title,
            authors: data.authors?.map((a: any) => a.name || a.key) || [],
            cover: data.covers ? `https://covers.openlibrary.org/b/id/${data.covers[0]}-L.jpg` : undefined,
            data,
          }
        });
        updated++;
      } catch (e) {
        this.logger.warn(`Failed to refresh book ${book.isbn}`);
      }
    }
    return updated;
  }

  async getAllBooks(): Promise<BookDocument[]> {
    return this.bookModel.find().lean();
  }

  async getPaginatedBooks(page: number, limit: number, q?: string) {
    const skip = (page - 1) * limit;
    let filter = {};
    if (q && q.trim()) {
      const regex = new RegExp(q.trim(), 'i');
      filter = {
        $or: [
          { title: regex },
          { authors: regex },
        ],
      };
    }
    const [books, total] = await Promise.all([
      this.bookModel.find(filter).skip(skip).limit(limit).lean(),
      this.bookModel.countDocuments(filter),
    ]);
    return {
      books,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }
  async seedDefaultBooks(): Promise<{ seeded: number; books: BookDocument[] }> {
    const count = await this.bookModel.countDocuments();
    if (count > 0) {
      return { seeded: 0, books: await this.bookModel.find().lean() };
    }
    // 10 popular ISBNs (can be changed as needed)
    const defaultIsbns = [
      '9780140328721', // Matilda
      '9780439139601', // Harry Potter and the Goblet of Fire
      '9780061120084', // To Kill a Mockingbird
      '9780747532743', // Harry Potter and the Philosopher's Stone
      '9780316769488', // The Catcher in the Rye
      '9780451524935', // 1984
      '9780618260300', // The Hobbit
      '9780545010221', // Harry Potter and the Deathly Hallows
      '9780140449136', // The Odyssey
      '9780141439600', // Jane Eyre
    ];
    const books: BookDocument[] = [];
    for (const isbn of defaultIsbns) {
      try {
        const book = await this.fetchAndCacheBook(isbn);
        books.push(book);
      } catch (e) {
        this.logger.warn(`Failed to seed book for ISBN ${isbn}`);
      }
    }
    return { seeded: books.length, books };
  }
}
