import { AxiosResponse } from 'axios';
import { Injectable, HttpService } from '@nestjs/common';

@Injectable()
export class ReportDotNetService {
  constructor(private readonly httpService: HttpService) {}

  getReportFromDotNet(filters: any, reportId: string): Promise<AxiosResponse> {
    const endpoint = `?from=${filters.fromDate}&to=${filters.toDate}&type=${filters.typeReport}&department=${filters.department}&on=${filters.onDate}`;
    const agentIds = filters.agents.map(item => item.value);
    return this.httpService
      .post(endpoint, {
        agents: agentIds,
        reportId: reportId
      })
      .toPromise();
  }
}
