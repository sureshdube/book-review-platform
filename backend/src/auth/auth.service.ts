
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import * as bcrypt from 'bcryptjs';
import { User, UserDocument } from '../schemas/user.schema';

@Injectable()
export class AuthService {
  constructor(
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    private jwtService: JwtService,
  ) {}

  async signup(email: string, password: string) {
    const existing = await this.userModel.findOne({ email });
    if (existing) {
      const err: any = new Error('Email already exists');
      err.code = 11000;
      throw err;
    }
    const hash = await bcrypt.hash(password, 10);
    const user = await this.userModel.create({ email, password: hash });
    const { password: _, ...result } = user.toObject();
    const tokens = this.getTokens(user);
    return { _id: user._id, email: user.email, ...tokens };
  }
  async validateUser(email: string, pass: string): Promise<any> {
    const user = await this.userModel.findOne({ email });
    if (!user || typeof user.password !== 'string' || !user.password) {
      return null;
    }
    try {
      if (await bcrypt.compare(pass, user.password)) {
        return user;
      }
    } catch (e) {
      return null;
    }
    return null;
  }

  async login(user: any) {
    const tokens = this.getTokens(user);
    return { _id: user._id, email: user.email, ...tokens };
  }

  getTokens(user: any) {
    const payload = { username: user.email, sub: user._id };
    return {
      access_token: this.jwtService.sign(payload, { expiresIn: '15m' }),
      refresh_token: this.jwtService.sign(payload, { expiresIn: '7d' }),
    };
  }
}
