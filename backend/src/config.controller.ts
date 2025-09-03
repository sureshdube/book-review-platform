import { Controller, Get, Post, Body, UseGuards } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Config, ConfigDocument } from './schemas/config.schema';

// Dummy admin guard for demonstration; replace with real auth in production
class AdminGuard {
  canActivate() { return true; }
}

@Controller('admin/config')
export class ConfigController {
  constructor(
    @InjectModel(Config.name) private configModel: Model<ConfigDocument>,
  ) {}

  @UseGuards(AdminGuard)
  @Post('openai-key')
  async setOpenAIKey(@Body('key') key: string) {
    if (!key) return { error: 'Key required' };
    await this.configModel.findOneAndUpdate(
      { key: 'openai_api_key' },
      { value: key },
      { upsert: true }
    );
    return { ok: true };
  }

  @UseGuards(AdminGuard)
  @Get('openai-key')
  async getOpenAIKey() {
    const doc = await this.configModel.findOne({ key: 'openai_api_key' });
    return { key: doc?.value || null };
  }
}
