    import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';

// Mock AuthService
const mockAuthService = {
  validateUser: jest.fn(),
  login: jest.fn(),
};

describe('AuthController', () => {
  let controller: AuthController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        { provide: AuthService, useValue: mockAuthService },
      ],
    }).compile();

    controller = module.get<AuthController>(AuthController);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('should return tokens on valid login', async () => {
    mockAuthService.validateUser.mockResolvedValue({ email: 'test', _id: '1' });
    mockAuthService.login.mockResolvedValue({ access_token: 'token', refresh_token: 'refresh' });
    const result = await controller.login({ email: 'test', password: 'test' });
    expect(result).toEqual({ access_token: 'token', refresh_token: 'refresh' });
    expect(mockAuthService.validateUser).toHaveBeenCalledWith('test', 'test');
    expect(mockAuthService.login).toHaveBeenCalledWith({ email: 'test', _id: '1' });
  });

  it('should throw UnauthorizedException on invalid login', async () => {
    mockAuthService.validateUser.mockResolvedValue(null);
    await expect(controller.login({ email: 'bad', password: 'bad' })).rejects.toThrow('Invalid credentials');
  });
});
