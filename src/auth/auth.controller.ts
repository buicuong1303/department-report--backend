import { PermissionAuth } from './enum/permission-auth.enum';
import { GetUser } from './decorator/get-user.decorator';
import { PermissionAuthGuard } from './guard/permission-auth.guard';
import { SessionAuthGuard } from './guard/session-auth.guard';
import { Controller, Get, UseGuards } from '@nestjs/common';
import { AuthService } from './auth.service';

@UseGuards(SessionAuthGuard, PermissionAuthGuard)
@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Get('/user-info')
  getUserInfo(@GetUser() user: any) {
    return this.authService.getUserInfo(user);
  }
}
