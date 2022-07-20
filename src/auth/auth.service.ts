import { AuthAutomationCoreService } from './../microservices/automation-core/auth-automation-core/auth-automation-core.service';
import { Injectable, Inject, UnauthorizedException } from '@nestjs/common';
import * as _ from 'lodash';

@Injectable()
export class AuthService {
  constructor(
    // eslint-disable-next-line @typescript-eslint/no-empty-function
    @Inject('AuthAutomationCoreService')
    private readonly authAutomationCoreService: AuthAutomationCoreService,
  ) {}

  async getUserInfo(user: any): Promise<any> {
    try {
      const response = await this.authAutomationCoreService.getPermissions(
        user,
      );
      const userInfo = {
        ...user,
        permissions: response.data.permissions,
      };
      return await userInfo;
    } catch (error) {
      if (error.response.status === 401) {
        throw new UnauthorizedException();
      }
      return error;
    }
  }
}
