import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { JwtService } from '@nestjs/jwt';
import { getModelToken } from '@nestjs/mongoose';
import * as bcrypt from 'bcryptjs';

const mockUserModel = {
  findOne: jest.fn(),
  create: jest.fn(),
};

const mockJwtService = {
  sign: jest.fn().mockReturnValue('signed-token'),
};

describe('AuthService', () => {
  let service: AuthService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: getModelToken('User'), useValue: mockUserModel },
        { provide: JwtService, useValue: mockJwtService },
      ],
    }).compile();
    service = module.get<AuthService>(AuthService);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should signup a new user', async () => {
    mockUserModel.findOne.mockResolvedValueOnce(null);
    mockUserModel.create.mockResolvedValueOnce({ _id: '1', email: 'a@b.com', password: 'hashed', toObject: () => ({ _id: '1', email: 'a@b.com' }) });
  jest.spyOn(bcrypt as any, 'hash').mockResolvedValueOnce('hashed');
    const result = await service.signup('a@b.com', 'pw');
    expect(result).toHaveProperty('_id', '1');
    expect(result).toHaveProperty('email', 'a@b.com');
    expect(result).toHaveProperty('access_token', 'signed-token');
    expect(result).toHaveProperty('refresh_token', 'signed-token');
  });

  it('should not signup if email exists', async () => {
    mockUserModel.findOne.mockResolvedValueOnce({ email: 'a@b.com' });
    await expect(service.signup('a@b.com', 'pw')).rejects.toThrow('Email already exists');
  });

  it('should validate user with correct password', async () => {
    mockUserModel.findOne.mockResolvedValueOnce({ email: 'a@b.com', password: 'hashed' });
  jest.spyOn(bcrypt as any, 'compare').mockResolvedValueOnce(true);
    const user = await service.validateUser('a@b.com', 'pw');
    expect(user).toHaveProperty('email', 'a@b.com');
  });

  it('should return null for invalid user', async () => {
    mockUserModel.findOne.mockResolvedValueOnce(null);
    const user = await service.validateUser('bad@b.com', 'pw');
    expect(user).toBeNull();
  });

  it('should return null for wrong password', async () => {
    mockUserModel.findOne.mockResolvedValueOnce({ email: 'a@b.com', password: 'hashed' });
  jest.spyOn(bcrypt as any, 'compare').mockResolvedValueOnce(false);
    const user = await service.validateUser('a@b.com', 'badpw');
    expect(user).toBeNull();
  });

  it('should login and return tokens', async () => {
    const user = { _id: '1', email: 'a@b.com' };
    const result = await service.login(user);
    expect(result).toHaveProperty('access_token', 'signed-token');
    expect(result).toHaveProperty('refresh_token', 'signed-token');
  });
});
