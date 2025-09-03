import { Controller, Get, Query } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User, UserDocument } from './schemas/user.schema';
import { Review, ReviewDocument } from './schemas/review.schema';
import { Book, BookDocument } from './schemas/book.schema';
import { Config, ConfigDocument } from './schemas/config.schema';
import axios from 'axios';

@Controller('recommendations')
export class RecommendationsController {
  constructor(
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    @InjectModel(Review.name) private reviewModel: Model<ReviewDocument>,
    @InjectModel(Book.name) private bookModel: Model<BookDocument>,
    @InjectModel(Config.name) private configModel: Model<ConfigDocument>,
  ) {}

  @Get()
  async getRecommendations(@Query('userId') userId: string) {
    if (!userId) return { error: 'userId required' };
    // Get OpenAI key
    const config = await this.configModel.findOne({ key: 'openai_api_key' });
    if (!config?.value) return { error: 'OpenAI API key not set' };
    // Get user reviews and favourites
    const user = await this.userModel.findById(userId).lean();
    if (!user) return { error: 'User not found' };
    const reviews = await this.reviewModel.find({ user: userId }).lean();
    const favIsbns = user.favourites || [];
    const favBooks = favIsbns.length ? await this.bookModel.find({ isbn: { $in: favIsbns } }).lean() : [];
    // Prepare prompt
  const reviewTitles = reviews.map(r => r.isbn).join(', ');
    const favTitles = favBooks.map(b => b.title).join(', ');
    const prompt = `Suggest 5 books for a user who liked: ${favTitles || reviewTitles || 'N/A'}. Reply as a JSON array of book titles.`;
    // Call OpenAI
    try {
      const resp = await axios.post('https://api.openai.com/v1/chat/completions', {
        model: 'gpt-3.5-turbo',
        messages: [{ role: 'user', content: prompt }],
        max_tokens: 200,
        temperature: 0.7,
      }, {
        headers: { 'Authorization': `Bearer ${config.value}` }
      });
      // Try to parse JSON from response
      const text = resp.data.choices?.[0]?.message?.content || '';
      let recommendations = [];
      try { recommendations = JSON.parse(text); } catch { recommendations = [text]; }
      return { recommendations };
    } catch (err) {
      return { error: 'OpenAI API error', details: err?.response?.data || err.message };
    }
  }
}
