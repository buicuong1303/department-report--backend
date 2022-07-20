import { JwtModule } from '@nestjs/jwt';
import { Module, Global } from '@nestjs/common';
import { JwtCustomService } from './jwt-custom.service';
import * as config from 'config';

const jwtConfig = config.get('jwt');

@Global()
@Module({
  imports: [
    JwtModule.register({
      secret: process.env.JWT_SECRET || jwtConfig.secret,
    }),
  ],
  providers: [JwtCustomService],
  exports: [JwtCustomService],
})
export class JwtCustomModule {}
