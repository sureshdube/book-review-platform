import { Test, TestingModule } from '@nestjs/testing';
import { ReviewService } from './review.service';
import { getModelToken } from '@nestjs/mongoose';

const mockReviewModel = {
  aggregate: jest.fn(),
  findOne: jest.fn(),
  create: jest.fn(),
  find: jest.fn(),
  findOneAndDelete: jest.fn(),
};
const mockBookModel = {
  findOne: jest.fn(),
};

describe('ReviewService', () => {
  let service: ReviewService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ReviewService,
        { provide: getModelToken('Review'), useValue: mockReviewModel },
        { provide: getModelToken('Book'), useValue: mockBookModel },
      ],
    }).compile();
    service = module.get<ReviewService>(ReviewService);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should get rating stats', async () => {
    mockReviewModel.aggregate.mockResolvedValueOnce([{ avg: 4.5, count: 2 }]);
    const stats = await service.getRatingStats('isbn');
    expect(stats).toEqual({ avgRating: 4.5, reviewCount: 2 });
  });

  it('should create a review', async () => {
    mockBookModel.findOne.mockResolvedValueOnce({ isbn: 'isbn' });
    mockReviewModel.findOne.mockResolvedValueOnce(null);
    mockReviewModel.create.mockResolvedValueOnce({ _id: '1', isbn: 'isbn', user: 'u', userEmail: 'e', rating: 5 });
    const review = await service.createReview('isbn', 'u', 'e', 5, 'text');
    expect(review).toHaveProperty('isbn', 'isbn');
    expect(review).toHaveProperty('user', 'u');
  });

  it('should not create review if already exists', async () => {
    mockBookModel.findOne.mockResolvedValueOnce({ isbn: 'isbn' });
    mockReviewModel.findOne.mockResolvedValueOnce({ _id: '1' });
    await expect(service.createReview('isbn', 'u', 'e', 5, 'text')).rejects.toThrow('You have already reviewed this book');
  });

  it('should not create review if book not found', async () => {
    mockBookModel.findOne.mockResolvedValueOnce(null);
    await expect(service.createReview('isbn', 'u', 'e', 5, 'text')).rejects.toThrow('Book not found');
  });

  it('should get reviews for book', async () => {
    mockReviewModel.find.mockReturnValueOnce({
      sort: jest.fn().mockReturnValueOnce({
        lean: jest.fn().mockResolvedValueOnce(['r1', 'r2'])
      })
    });
    const reviews = await service.getReviewsForBook('isbn');
    expect(reviews).toEqual(['r1', 'r2']);
  });

  it('should update review', async () => {
    const save = jest.fn();
    mockReviewModel.findOne.mockResolvedValueOnce({ _id: '1', isbn: 'isbn', user: 'u', rating: 3, text: 't', save });
    const updated = await service.updateReview('isbn', '1', 'u', 5, 'new');
    expect(updated.rating).toBe(5);
    expect(updated.text).toBe('new');
    expect(save).toHaveBeenCalled();
  });

  it('should not update if review not found', async () => {
    mockReviewModel.findOne.mockResolvedValueOnce(null);
    await expect(service.updateReview('isbn', '1', 'u', 5, 'new')).rejects.toThrow('Review not found or not owned by user');
  });

  it('should delete review', async () => {
    mockReviewModel.findOneAndDelete.mockResolvedValueOnce({ _id: '1' });
    const result = await service.deleteReview('isbn', '1', 'u');
    expect(result).toEqual({ deleted: true });
  });

  it('should not delete if review not found', async () => {
    mockReviewModel.findOneAndDelete.mockResolvedValueOnce(null);
    await expect(service.deleteReview('isbn', '1', 'u')).rejects.toThrow('Review not found or not owned by user');
  });
});
