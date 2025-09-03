import { Test, TestingModule } from '@nestjs/testing';
import { BookService } from './book.service';
import { getModelToken } from '@nestjs/mongoose';
import axios from 'axios';

jest.mock('axios');

const mockBookModel = {
  findOne: jest.fn(),
  create: jest.fn(),
  find: jest.fn(),
  updateOne: jest.fn(),
  countDocuments: jest.fn(),
  db: {
    collection: jest.fn().mockReturnValue({
      aggregate: jest.fn().mockReturnValue({ toArray: jest.fn().mockResolvedValue([{ avg: 4.5, count: 2 }]) })
    })
  },
};

describe('BookService', () => {
  let service: BookService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BookService,
        { provide: getModelToken('Book'), useValue: mockBookModel },
      ],
    }).compile();
    service = module.get<BookService>(BookService);
    jest.clearAllMocks();
  });

  it('should return cached book if exists', async () => {
    mockBookModel.findOne.mockResolvedValue({ isbn: '123' });
    const book = await service.fetchAndCacheBook('123');
    expect(book).toEqual({ isbn: '123' });
    expect(mockBookModel.findOne).toHaveBeenCalledWith({ isbn: '123' });
  });

  it('should fetch and cache book if not cached', async () => {
    mockBookModel.findOne.mockResolvedValueOnce(null);
    (axios.get as jest.Mock).mockResolvedValueOnce({ data: { title: 'Test', authors: [{ name: 'A' }], covers: [1] } });
    mockBookModel.create.mockResolvedValueOnce({ isbn: '123', title: 'Test' });
    const book = await service.fetchAndCacheBook('123');
    expect(book).toEqual({ isbn: '123', title: 'Test' });
    expect(mockBookModel.create).toHaveBeenCalled();
  });

  it('should throw if Open Library fails', async () => {
    mockBookModel.findOne.mockResolvedValueOnce(null);
    (axios.get as jest.Mock).mockRejectedValueOnce(new Error('fail'));
    await expect(service.fetchAndCacheBook('bad')).rejects.toThrow('fail');
  });

  it('should refresh all books', async () => {
    mockBookModel.find.mockResolvedValue([{ isbn: '1' }, { isbn: '2' }]);
    (axios.get as jest.Mock).mockResolvedValue({ data: { title: 'T', authors: [], covers: [1] } });
    mockBookModel.updateOne.mockResolvedValue({});
    const updated = await service.refreshAllBooks();
    expect(updated).toBe(2);
  });

  it('should handle error in refreshAllBooks', async () => {
    mockBookModel.find.mockResolvedValue([{ isbn: '1' }]);
    (axios.get as jest.Mock).mockRejectedValueOnce(new Error('fail'));
    mockBookModel.updateOne.mockResolvedValue({});
    const updated = await service.refreshAllBooks();
    expect(updated).toBe(0);
  });

  it('should get all books', async () => {
    mockBookModel.find.mockReturnValueOnce({ lean: jest.fn().mockResolvedValueOnce(['b1', 'b2']) });
    const books = await service.getAllBooks();
    expect(books).toEqual(['b1', 'b2']);
  });

  it('should get paginated books', async () => {
    mockBookModel.find.mockReturnValueOnce({ skip: () => ({ limit: () => ({ lean: jest.fn().mockResolvedValueOnce(['b1']) }) }) });
    mockBookModel.countDocuments.mockResolvedValueOnce(1);
    const result = await service.getPaginatedBooks(1, 1, '');
    expect(result.books).toEqual(['b1']);
    expect(result.total).toBe(1);
  });

  it('should get paginated books with stats (no query)', async () => {
    mockBookModel.find.mockReturnValueOnce({ skip: () => ({ limit: () => ({ lean: jest.fn().mockResolvedValueOnce([{ isbn: '1' }]) }) }) });
    mockBookModel.countDocuments.mockResolvedValueOnce(1);
    mockBookModel.db.collection = jest.fn().mockReturnValue({
      aggregate: jest.fn().mockReturnValue({ toArray: jest.fn().mockResolvedValue([{ avg: 4.5, count: 2 }]) })
    });
    const result = await service.getPaginatedBooksWithStats(1, 1);
    expect(result.books[0].ratingStats).toEqual({ avgRating: 4.5, reviewCount: 2 });
  });

  it('should get paginated books with stats (with query)', async () => {
    mockBookModel.find.mockReturnValueOnce({ skip: () => ({ limit: () => ({ lean: jest.fn().mockResolvedValueOnce([{ isbn: '1' }]) }) }) });
    mockBookModel.countDocuments.mockResolvedValueOnce(1);
    mockBookModel.db.collection = jest.fn().mockReturnValue({
      aggregate: jest.fn().mockReturnValue({ toArray: jest.fn().mockResolvedValue([{ avg: 4.5, count: 2 }]) })
    });
    const result = await service.getPaginatedBooksWithStats(1, 1, 'test');
    expect(result.books[0].ratingStats).toEqual({ avgRating: 4.5, reviewCount: 2 });
  });

  it('should return books if already seeded in seedDefaultBooks', async () => {
    mockBookModel.countDocuments.mockResolvedValueOnce(1);
    mockBookModel.find.mockReturnValueOnce({ lean: jest.fn().mockResolvedValueOnce(['b1']) });
    const result = await service.seedDefaultBooks();
    expect(result.seeded).toBe(0);
    expect(result.books).toEqual(['b1']);
  });

  it('should seed default books if none exist', async () => {
    mockBookModel.countDocuments.mockResolvedValueOnce(0);
    service.fetchAndCacheBook = jest.fn().mockResolvedValue({ isbn: '1' });
    mockBookModel.find.mockReturnValueOnce({ lean: jest.fn().mockResolvedValueOnce([]) });
    const result = await service.seedDefaultBooks();
    expect(result.seeded).toBeGreaterThanOrEqual(1);
  });
});
