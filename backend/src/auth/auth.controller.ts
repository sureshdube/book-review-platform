
import { Controller, Post, Body, UnauthorizedException, ConflictException } from '@nestjs/common';
import { AuthService } from './auth.service';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  async login(@Body() body: { email: string; password: string }) {
    const user = await this.authService.validateUser(body.email, body.password);
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }
    return this.authService.login(user);
  }

  @Post('signup')
  async signup(@Body() body: { email: string; password: string }) {
    try {
      return await this.authService.signup(body.email, body.password);
    } catch (e) {
      if (e.code === 11000) {
        throw new ConflictException('Email already exists');
      }
      throw e;
    }
  }
}
