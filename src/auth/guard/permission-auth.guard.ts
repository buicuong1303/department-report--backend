import { AuthAutomationCoreService } from './../../microservices/automation-core/auth-automation-core/auth-automation-core.service';
import {
  Injectable,
  CanActivate,
  ExecutionContext,
  Inject,
  ForbiddenException,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { Reflector } from '@nestjs/core';
import { intersection } from 'lodash';

@Injectable()
export class PermissionAuthGuard implements CanActivate {
  constructor(
    @Inject('AuthAutomationCoreService')
    private readonly authAutomationCoreService: AuthAutomationCoreService,
    private readonly reflector: Reflector,
  ) {}

  canActivate(
    context: ExecutionContext,
  ): boolean | Promise<boolean> | Observable<boolean> {
    //* get permissions(permission request)
    // return true;
    const permissions = this.reflector.getAllAndOverride<string[]>(
      'permissions',
      [context.getHandler(), context.getClass()],
    );
    if (!permissions) {
      return true;
    }

    const request = context.switchToHttp().getRequest();

    return this.validateRequest(request, permissions);
  }

  async validateRequest(request: any, permissions): Promise<boolean> {
    //* get permission of user from automation core
    // return true;
    // const user = request.user;
    // const response = await this.authAutomationCoreService.getPermissions(user);
    // const permissionsOfUser = response.data.permissions;

    // if (permissions[0] === 'or') {
    //   for (let i = 1; i < permissions.length; i++) {
    //     if (permissionsOfUser.indexOf(permissions[i]) !== -1) {
    //       return true;
    //     }
    //   }
    //   return false;
    // }

    // //* compare permissionsOfUser anh permissions(permissions request)
    // if (
    //   intersection(permissionsOfUser, permissions)
    //     .sort()
    //     .toString()
    //     .replace(/[,]+/g, '') ===
    //   permissions
    //     .sort()
    //     .toString()
    //     .replace(/[,]+/g, '')
    // ) {
    //   return true;
    // } else {
    //   throw new ForbiddenException(
    //     `Sorry you are restricted from this function`,
    //   );
    // }
    return true;
  }
}
