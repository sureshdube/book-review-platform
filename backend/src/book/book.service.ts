import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Book, BookDocument } from '../schemas/book.schema';
import axios, { AxiosError } from 'axios';
const OPENLIB_BASE = 'https://openlibrary.org';
const USER_AGENT = 'book-review-service/1.0 (contact: you@domain.com)';

// ---- Tunables (can be env-driven) ----
const MAX_ISBNS_PER_BATCH = parseInt(process.env.SEED_BATCH_SIZE ?? '25', 10);
const MIN_DELAY_BETWEEN_CALLS_MS = parseInt(process.env.OPENLIBRARY_RPS_MS ?? '1100', 10); // ~1 req/sec
const AXIOS_TIMEOUT_MS = parseInt(process.env.OPENLIBRARY_TIMEOUT_MS ?? '8000', 10);
const MAX_RETRIES = parseInt(process.env.OPENLIBRARY_MAX_RETRIES ?? '5', 10);
const OVERALL_SEED_TIMEOUT_MS = parseInt(process.env.SEED_TIMEOUT_MS ?? '15000', 10); // total time budget for the call

const http = axios.create({
  baseURL: OPENLIB_BASE,
  timeout: AXIOS_TIMEOUT_MS,
  headers: {
    'User-Agent': USER_AGENT,
    'Accept': 'application/json',
  },
});

const sleep = (ms: number) => new Promise(res => setTimeout(res, ms));
const chunk = <T>(arr: T[], size: number) => {
  const out: T[][] = [];
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
  return out;
};
@Injectable()
export class BookService {
  private readonly logger = new Logger(BookService.name);
  private lastCallAt = 0;
  constructor(
    @InjectModel(Book.name) private bookModel: Model<BookDocument>,
  ) {}
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
private async throttle() {
    const now = Date.now();
    const elapsed = now - this.lastCallAt;
    if (elapsed < MIN_DELAY_BETWEEN_CALLS_MS) {
      await sleep(MIN_DELAY_BETWEEN_CALLS_MS - elapsed);
    }
    this.lastCallAt = Date.now();
  }

  private async fetchBatch(isbns: string[], attempt = 1): Promise<any> {
    const bibkeys = isbns.map(i => `ISBN:${i}`).join(',');
    const url = `/api/books?bibkeys=${encodeURIComponent(bibkeys)}&format=json&jscmd=data`;

    await this.throttle();
    try {
      const resp = await http.get(url);
      return resp.data; // object keyed by "ISBN:<isbn>"
    } catch (err) {
      const e = err as AxiosError;
      const status = e.response?.status;

      // Backoff calculation: respect Retry-After if present, else 2^attempt (capped)
      if (status === 429 || (status && status >= 500)) {
        const retryAfterHeader = e.response?.headers?.['retry-after'];
        const retryAfter =
          (retryAfterHeader && Number(retryAfterHeader)) ||
          Math.min(2 ** attempt, 30); // seconds

        this.logger.warn(
          `OpenLibrary rate/Server limit (status ${status}). Waiting ${retryAfter}s before retry (attempt ${attempt}/${MAX_RETRIES}).`,
        );
        await sleep(retryAfter * 1000);

        if (attempt < MAX_RETRIES) return this.fetchBatch(isbns, attempt + 1);
      }

      this.logger.error(
        `OpenLibrary batch failed (status: ${status ?? 'n/a'}): ${e.message}`,
      );
      throw e;
    }
  }

  // Persist a single book from the OpenLibrary "data" node for an ISBN
  private async upsertFromOpenLib(isbn: string, dataNode: any): Promise<BookDocument | null> {
    if (!dataNode) return null;

    // Map a few common fields; adjust to match your schema
    const title = dataNode.title ?? '';
    const authors = (dataNode.authors ?? []).map((a: any) => a.name).filter(Boolean);
    const cover = dataNode.cover?.large || dataNode.cover?.medium || dataNode.cover?.small || null;
    const pages = dataNode.number_of_pages ?? null;
    const publishDate = dataNode.publish_date ?? null;
    const publishers = (dataNode.publishers ?? []).map((p: any) => p.name ?? p).filter(Boolean);

    // Upsert by ISBN
    const doc = await this.bookModel.findOneAndUpdate(
      { isbn },
      {
        isbn,
        title,
        authors,
        cover,
        pages,
        publishDate,
        publishers,
        source: 'openlibrary',
        updatedAt: new Date(),
      },
      { new: true, upsert: true, setDefaultsOnInsert: true },
    );

    return doc.toObject() as BookDocument;
  }

  // If you must keep your existing per-ISBN fetch function, wrap it:
  private async fetchAndCacheBookCompat(isbn: string): Promise<BookDocument | null> {
    // fallback single-ISBN endpoint (still throttled + retried)
    const url = `/api/books?bibkeys=ISBN:${isbn}&format=json&jscmd=data`;
    let attempt = 1;
    while (attempt <= MAX_RETRIES) {
      await this.throttle();
      try {
        const { data } = await http.get(url);
        const node = data?.[`ISBN:${isbn}`];
        return await this.upsertFromOpenLib(isbn, node);
      } catch (err) {
        const e = err as AxiosError;
        const status = e.response?.status;
        if (status === 429 || (status && status >= 500)) {
          const retryAfterHeader = e.response?.headers?.['retry-after'];
          const retryAfter =
            (retryAfterHeader && Number(retryAfterHeader)) ||
            Math.min(2 ** attempt, 30);
          this.logger.warn(`Single fetch rate/server limit for ${isbn}. Waiting ${retryAfter}s (attempt ${attempt}/${MAX_RETRIES}).`);
          await sleep(retryAfter * 1000);
          attempt++;
          continue;
        }
        this.logger.error(`Single fetch failed for ${isbn}: ${e.message}`);
        return null;
      }
    }
    return null;
  }

  /**
   * Public API: safe seeding with batching, throttling, retries, and a hard overall timeout.
   */
  async seedDefaultBooks(): Promise<{ seeded: number; books: BookDocument[]; timedOut: boolean }> {
    const start = Date.now();

    const timeLeft = () => OVERALL_SEED_TIMEOUT_MS - (Date.now() - start);
    const deadlineGuard = async () => {
      if (timeLeft() <= 0) {
        throw new Error('SEED_TIMEOUT');
      }
    };

    const count = await this.bookModel.countDocuments();
    if (count > 0) {
      const existing = await this.bookModel.find().lean();
      return { seeded: 0, books: existing, timedOut: false };
    }

    const defaultIsbns = [
      '9780140328721',
      '9780439139600',
      '9780439358064',
      '9780439784542',
      '9780439136365',
      '9780316769488',
      '9780743273565',
      '9780061120084',
      '9780547928227',
      '9780261103573',
    ];

    const uniqueIsbns = Array.from(new Set(defaultIsbns));
    const batches = chunk(uniqueIsbns, MAX_ISBNS_PER_BATCH);

    const seededDocs: BookDocument[] = [];
    let timedOut = false;

    try {
      for (const batch of batches) {
        await deadlineGuard(); // check global time budget before each remote call

        const data = await this.fetchBatch(batch); // throttled + retried
        // Upsert each result
        for (const isbn of batch) {
          const node = data?.[`ISBN:${isbn}`];
          try {
            const doc = await this.upsertFromOpenLib(isbn, node);
            if (doc) seededDocs.push(doc);
          } catch (e) {
            this.logger.warn(`Failed to persist seed for ISBN ${isbn}`);
          }
        }

        // Optional: small pause between batches (already throttled, usually not needed)
        // await sleep(150);
      }
    } catch (e: any) {
      if (e?.message === 'SEED_TIMEOUT') {
        this.logger.warn(`Seeding aborted due to overall timeout (${OVERALL_SEED_TIMEOUT_MS} ms). Returning partial results.`);
        timedOut = true;
      } else {
        this.logger.error(`Seeding failed: ${e?.message ?? e}`);
      }
    }

    return { seeded: seededDocs.length, books: seededDocs, timedOut };
  }
}
