import { Test, TestingModule } from '@nestjs/testing';
import { BookController } from './book.controller';
import { BookService } from './book.service';

const mockBookService = {
  fetchAndCacheBook: jest.fn(),
  refreshAllBooks: jest.fn(),
  getPaginatedBooksWithStats: jest.fn(),
  seedDefaultBooks: jest.fn(),
};

const mockReviewService = {
  updateReview: jest.fn(),
  deleteReview: jest.fn(),
  getReviewsForBook: jest.fn(),
  getRatingStats: jest.fn().mockResolvedValue({ avgRating: 5, reviewCount: 1 }),
  createReview: jest.fn(),
};

describe('BookController', () => {
  let controller: BookController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [BookController],
      providers: [
        { provide: BookService, useValue: mockBookService },
        { provide: require('./review.service').ReviewService, useValue: mockReviewService },
      ],
    }).compile();
    controller = module.get<BookController>(BookController);
    jest.clearAllMocks();
  });

  it('should get book by isbn', async () => {
    const bookObj = { isbn: '123', title: 'Test Book' };
    mockBookService.fetchAndCacheBook.mockResolvedValue({
      toObject: () => bookObj,
    });
    const result = await controller.getBook('123');
    expect(result).toEqual({ ...bookObj, ratingStats: { avgRating: 5, reviewCount: 1 } });
    expect(mockBookService.fetchAndCacheBook).toHaveBeenCalledWith('123');
  });

  it('should throw if book not found', async () => {
    mockBookService.fetchAndCacheBook.mockResolvedValue(null);
    await expect(controller.getBook('bad')).rejects.toThrow('Book not found');
  });

  it('should get rating stats', async () => {
    const stats = await controller.getRatingStats('123');
    expect(stats).toEqual({ avgRating: 5, reviewCount: 1 });
    expect(mockReviewService.getRatingStats).toHaveBeenCalledWith('123');
  });

  it('should get all books', async () => {
    mockBookService.getPaginatedBooksWithStats = jest.fn().mockResolvedValue({ books: [], total: 0 });
    const result = await controller.getAllBooks('1', '20', '');
    expect(result).toEqual({ books: [], total: 0 });
    expect(mockBookService.getPaginatedBooksWithStats).toHaveBeenCalledWith(1, 20, '');
  });

  it('should create a review', async () => {
    mockReviewService.createReview = jest.fn().mockResolvedValue({ _id: '1', isbn: '123', user: 'u', userEmail: 'e', rating: 5 });
    const body = { rating: 5, text: 't', user: 'u', userEmail: 'e' };
    const result = await controller.createReview('123', body);
    expect(result).toHaveProperty('isbn', '123');
    expect(mockReviewService.createReview).toHaveBeenCalledWith('123', 'u', 'e', 5, 't');
  });

  it('should update a review', async () => {
    mockReviewService.updateReview = jest.fn().mockResolvedValue({ _id: '1', rating: 4 });
    const result = await controller.updateReview('123', '1', { rating: 4, user: 'u' });
    expect(result).toHaveProperty('rating', 4);
    expect(mockReviewService.updateReview).toHaveBeenCalledWith('123', '1', 'u', 4, undefined);
  });

  it('should delete a review', async () => {
    mockReviewService.deleteReview = jest.fn().mockResolvedValue({ deleted: true });
    const result = await controller.deleteReview('123', '1', { user: 'u' });
    expect(result).toEqual({ deleted: true });
    expect(mockReviewService.deleteReview).toHaveBeenCalledWith('123', '1', 'u');
  });

  it('should get reviews for a book', async () => {
    mockReviewService.getReviewsForBook = jest.fn().mockResolvedValue([{ _id: '1', text: 't' }]);
    const result = await controller.getReviews('123');
    expect(result).toEqual([{ _id: '1', text: 't' }]);
    expect(mockReviewService.getReviewsForBook).toHaveBeenCalledWith('123');
  });

  it('should seed default books', async () => {
    mockBookService.seedDefaultBooks = jest.fn().mockResolvedValue({ seeded: true });
    const result = await controller.seedDefaults();
    expect(result).toEqual({ seeded: true });
    expect(mockBookService.seedDefaultBooks).toHaveBeenCalled();
  });

  it('should refresh all books', async () => {
    mockBookService.refreshAllBooks = jest.fn().mockResolvedValue(5);
    const result = await controller.refreshAll();
    expect(result).toEqual({ updated: 5 });
    expect(mockBookService.refreshAllBooks).toHaveBeenCalled();
  });
});
