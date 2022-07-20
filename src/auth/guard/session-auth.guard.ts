import { checkExpirationToken } from './../../utils/jwt';
import { JwtCustomService } from './../../jwt-custom/jwt-custom.service';
import {
  Injectable,
  CanActivate,
  ExecutionContext,
  Inject,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import * as _ from 'lodash';

@Injectable()
export class SessionAuthGuard implements CanActivate {
  constructor(
    @Inject('JwtCustomService')
    private readonly jwtCustomService: JwtCustomService,
  ) {}

  canActivate(
    context: ExecutionContext,
  ): boolean | Promise<boolean> | Observable<boolean> {
    const request = context.switchToHttp().getRequest();
    if (request.headers.hasOwnProperty('authorization')) {
      let token = request.headers['authorization'];

      if (token.startsWith('Bearer ')) {
        // Remove Bearer from string
        token = token.slice(7, token.length);
        return this.validateRequest(request, token);
      }
    }

    return true;
  }

  async validateRequest(request: any, token: string): Promise<boolean> {
    try {
      const payload = this.jwtCustomService.decode(token);

      if (!payload) return false;

      // if (checkExpirationToken(payload['exp'])) {
      // 	return false;
      // }

      request.user = {
        ..._.pick(payload, ['id', 'fullName']),
        token,
      };
      return true;
    } catch (err) {
      return false;
    }
  }
}
