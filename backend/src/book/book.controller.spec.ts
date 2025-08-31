import { Test, TestingModule } from '@nestjs/testing';
import { BookController } from './book.controller';
import { BookService } from './book.service';

const mockBookService = {
  fetchAndCacheBook: jest.fn(),
  refreshAllBooks: jest.fn(),
};

describe('BookController', () => {
  let controller: BookController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [BookController],
      providers: [
        { provide: BookService, useValue: mockBookService },
      ],
    }).compile();
    controller = module.get<BookController>(BookController);
    jest.clearAllMocks();
  });

  it('should get book by isbn', async () => {
    mockBookService.fetchAndCacheBook.mockResolvedValue({ isbn: '123' });
    const result = await controller.getBook('123');
    expect(result).toEqual({ isbn: '123' });
    expect(mockBookService.fetchAndCacheBook).toHaveBeenCalledWith('123');
  });

  it('should refresh all books', async () => {
    mockBookService.refreshAllBooks.mockResolvedValue(2);
    const result = await controller.refreshAll();
    expect(result).toEqual({ updated: 2 });
    expect(mockBookService.refreshAllBooks).toHaveBeenCalled();
  });
});
