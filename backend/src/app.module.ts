import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ConfigModule } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { User, UserSchema } from './schemas/user.schema';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { Book, BookSchema } from './schemas/book.schema';
import { BookService } from './book/book.service';
import { BookController } from './book/book.controller';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    MongooseModule.forRoot(process.env.MONGODB_URI),
    MongooseModule.forFeature([
      { name: User.name, schema: UserSchema },
      { name: Book.name, schema: BookSchema },
    ]),
    JwtModule.register({
      secret: process.env.JWT_SECRET,
      signOptions: { expiresIn: process.env.JWT_ACCESS_EXPIRES_IN || '300s' },
    }),
    AuthModule,
  ],
  controllers: [BookController, require('./auth/auth.controller').AuthController],
  providers: [AppService, BookService],
})
export class AppModule {}
