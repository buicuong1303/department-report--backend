import { Injectable, HttpService } from '@nestjs/common';
import { AxiosResponse } from 'axios';

@Injectable()
export class AppsService {
  constructor(private readonly httpService: HttpService) {}

  getUserInApps(user): Promise<AxiosResponse> {
    return this.httpService
      .get(`/users`, { headers: { Authorization: `Bearer ${user.token}` } })
      .toPromise();
  }
}
