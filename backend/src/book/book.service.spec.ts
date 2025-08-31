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
});
