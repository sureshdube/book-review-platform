
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ConfigService } from '@nestjs/config';

// Load .env if not already loaded
import { config as dotenvConfig } from 'dotenv';
dotenvConfig();

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.enableCors({
    origin: [
      'http://localhost',
       'http://localhost:3000',
      'http://localhost:5173',
      'http://127.0.0.1',
      'http://127.0.0.1:5173',
    ],
    credentials: true,
  });
  await app.listen(3000);
}
bootstrap();
