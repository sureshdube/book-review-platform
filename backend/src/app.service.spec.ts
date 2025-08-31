import { Test, TestingModule } from '@nestjs/testing';
import { AppService } from './app.service';
import { getModelToken } from '@nestjs/mongoose';

const mockUserModel = {
  create: jest.fn(),
  find: jest.fn().mockReturnThis(),
  exec: jest.fn(),
};

describe('AppService', () => {
  let service: AppService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AppService,
        { provide: getModelToken('User'), useValue: mockUserModel },
      ],
    }).compile();
    service = module.get<AppService>(AppService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should create a user', async () => {
    mockUserModel.create.mockResolvedValue({ email: 'test', password: 'pw' });
    const user = await service.createUser({ email: 'test', password: 'pw' });
    expect(user).toEqual({ email: 'test', password: 'pw' });
    expect(mockUserModel.create).toHaveBeenCalledWith({ email: 'test', password: 'pw' });
  });

  it('should get all users', async () => {
    mockUserModel.find.mockReturnThis();
    mockUserModel.exec.mockResolvedValue([{ email: 'test', password: 'pw' }]);
    const users = await service.getAllUsers();
    expect(users).toEqual([{ email: 'test', password: 'pw' }]);
    expect(mockUserModel.find).toHaveBeenCalled();
    expect(mockUserModel.exec).toHaveBeenCalled();
  });
});
