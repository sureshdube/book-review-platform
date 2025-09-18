
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ConfigService } from '@nestjs/config';

// Load .env if not already loaded
import { config as dotenvConfig } from 'dotenv';
dotenvConfig();

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.enableCors({
    origin: "*"
  });
  await app.listen(3000);
}
bootstrap();
