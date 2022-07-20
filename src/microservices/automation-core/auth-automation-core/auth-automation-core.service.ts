import { Injectable, HttpService } from '@nestjs/common';
import * as config from 'config';

const appId = config.get('app-id');

@Injectable()
export class AuthAutomationCoreService {
  constructor(private readonly httpService: HttpService) {}

  async getPermissions(user: any): Promise<any> {
    return await this.httpService
      .get(`apps/${appId}/users/${user.id}/permissions`, {
        headers: { Authorization: `Bearer ${user.token}` },
      })
      .toPromise();
  }
}
