import { Controller, Get, Patch, Body, UseGuards, Req, Query } from '@nestjs/common';
import { UsersService } from './users.service';
import { AuthGuard } from '@nestjs/passport';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @UseGuards(AuthGuard('jwt'))
  @Get('profile')
  async getProfile(@Req() req: any) {
    return this.usersService.getProfile(req.user.userId);
  }

  @UseGuards(AuthGuard('jwt'))
  @Patch('profile')
  async updateProfile(
    @Req() req: any,
    @Body()
    body: {
      email?: string;
      firstName?: string;
      lastName?: string;
      affiliation?: string;
    },
  ) {
    return this.usersService.updateProfile(req.user.userId, body);
  }

  @UseGuards(AuthGuard('jwt'))
  @Get('search')
  async searchUsers(@Query('q') query: string, @Req() req: any) {
    if (!query || query.trim().length < 2) return [];
    return this.usersService.searchByEmail(query.trim(), req.user.userId);
  }
}
