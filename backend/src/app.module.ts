import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { JwtModule } from '@nestjs/jwt';
import { User, UserSchema } from './schemas/user.schema';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { Book, BookSchema } from './schemas/book.schema';
import { BookService } from './book/book.service';
import { BookController } from './book/book.controller';
import { Review, ReviewSchema } from './schemas/review.schema';
import { ReviewService } from './book/review.service';
import { Config, ConfigSchema } from './schemas/config.schema';
import { ConfigController } from './config.controller';
import { RecommendationsController } from './recommendations.controller';

@Module({
  imports: [
    MongooseModule.forRoot(process.env.MONGODB_URI),
    MongooseModule.forFeature([
      { name: User.name, schema: UserSchema },
      { name: Book.name, schema: BookSchema },
      { name: Review.name, schema: ReviewSchema },
      { name: Config.name, schema: ConfigSchema },
    ]),
    JwtModule.register({
      secret: process.env.JWT_SECRET,
      signOptions: { expiresIn: process.env.JWT_ACCESS_EXPIRES_IN || '300s' },
    }),
    AuthModule,
  ],
  controllers: [BookController, require('./auth/auth.controller').AuthController, require('./user/user.controller').UserController, ConfigController, RecommendationsController],
  providers: [AppService, BookService, ReviewService],
})
export class AppModule {}
