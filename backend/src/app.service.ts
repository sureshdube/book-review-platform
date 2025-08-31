import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User, UserDocument } from './schemas/user.schema';

@Injectable()
export class AppService {
  constructor(
    @InjectModel(User.name) private userModel: Model<UserDocument>,
  ) {}

  async createUser(user: Partial<User>): Promise<User> {
    return this.userModel.create(user);
  }

  async getAllUsers(): Promise<User[]> {
    return this.userModel.find().exec();
  }
}
