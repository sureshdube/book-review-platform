import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { JwtService } from '@nestjs/jwt';
import { getModelToken } from '@nestjs/mongoose';
import * as bcrypt from 'bcryptjs';

describe('AuthService', () => {
  // it('should return null if user is found but password is missing', async () => {
  //   // Simulate user object with password explicitly undefined at the top level
  //   const userObj = { email: 'test', password: undefined, toObject: function() { return { email: 'test' }; } };
  //   userModel.findOne.mockResolvedValue(userObj);
  //   const user = await service.validateUser('test', 'test');
  //   expect(user).toBeNull();
  // });

  it('should throw UnauthorizedException if login credentials are invalid', async () => {
    userModel.findOne.mockResolvedValue(null);
    await expect(service.login('bad', 'bad')).rejects.toThrow('Invalid credentials');
  });

  // it('should handle bcrypt.compare throwing error gracefully', async () => {
  //   // Simulate user object with password property
  //   const userObj = { email: 'test', password: 'pw', toObject: function() { return { email: 'test', password: 'pw' }; } };
  //   userModel.findOne.mockResolvedValue(userObj);
  //   jest.spyOn(bcrypt, 'compare').mockImplementationOnce(() => { throw new Error('bcrypt error'); });
  //   const user = await service.validateUser('test', 'test');
  //   expect(user).toBeNull();
  // });
  let service: AuthService;
  let userModel: any;
  let jwtService: JwtService;

  beforeEach(async () => {
    userModel = {
      findOne: jest.fn(),
      create: jest.fn(),
    };
    jwtService = new JwtService({ secret: 'test' });
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: getModelToken('User'), useValue: userModel },
        { provide: JwtService, useValue: jwtService },
      ],
    }).compile();
    service = module.get<AuthService>(AuthService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should validate user with correct password', async () => {
    const hash = await bcrypt.hash('test', 1);
    userModel.findOne.mockResolvedValue({ email: 'test', password: hash, toObject: function() { return { email: 'test', password: hash }; } });
    const user = await service.validateUser('test', 'test');
    expect(user).toBeDefined();
  expect(user.email).toBe('test');
  });

  it('should not validate user with wrong password', async () => {
    const hash = await bcrypt.hash('test', 1);
    userModel.findOne.mockResolvedValue({ email: 'test', password: hash, toObject: function() { return { email: 'test', password: hash }; } });
    const user = await service.validateUser('test', 'wrong');
    expect(user).toBeNull();
  });

  it('should return null if user is not found', async () => {
    userModel.findOne.mockResolvedValue(null);
    const user = await service.validateUser('notfound', 'test');
    expect(user).toBeNull();
  });

  it('should return access and refresh tokens on login', async () => {
  userModel.findOne.mockResolvedValue({ _id: '123', email: 'test', password: await bcrypt.hash('pw', 1) });
  const result = await service.login('test', 'pw');
  expect(result).toHaveProperty('accessToken');
  expect(result).toHaveProperty('refreshToken');
  expect(typeof result['accessToken']).toBe('string');
  expect(typeof result['refreshToken']).toBe('string');
  });

  it('should call jwtService.sign with correct payload for login', async () => {
  userModel.findOne.mockResolvedValue({ _id: '123', email: 'test', password: await bcrypt.hash('pw', 1) });
  const signSpy = jest.spyOn(jwtService, 'sign');
  await service.login('test', 'pw');
  expect(signSpy).toHaveBeenCalledWith({ sub: '123', email: 'test' }, expect.objectContaining({ expiresIn: expect.any(String) }));
  expect(signSpy).toHaveBeenCalledTimes(2);
  });
});