import { FiltersDto } from './dto/filters.dto';
import { Report } from './entity/report.entity';
import { ReportQueueService } from './../queues/report-queue/report-queue.service';
import {
  HttpException,
  HttpStatus,
  Injectable,
  NotFoundException,
  ServiceUnavailableException,
} from '@nestjs/common';
import { ReportDotNetService } from 'src/microservices/backend-report/report-dot-net/report-dot-net.service';
import { Job } from 'bull';
import { ReportRepository } from './repository/report.repository';
import { InjectRepository } from '@nestjs/typeorm';
import { ReportStatus } from './enum/report-status.enum';
import { EntityStatus } from 'src/utils/entity-status';
import { getManager } from 'typeorm';

@Injectable()
export class ExportService {
  constructor(
    private readonly _reportServiceDotNet: ReportDotNetService,
    private readonly _reportQueueService: ReportQueueService,
    @InjectRepository(ReportRepository)
    private readonly _reportRepository: ReportRepository,
  ) {}
  async getReport(filters: FiltersDto, user: any): Promise<any> {
    const data = await this._getReportTimeout(filters, user);
    return data;
  }

  private async _getReportTimeout(filters: FiltersDto, user: any) {
    const report = new Report();
    report.type = filters.typeReport;
    report.creationUserId = user.id;
    report.lastModifiedUserId = user.id;

    await report.save();

    const exportReportJob: Job<any> = await this._reportQueueService.exportReport(filters, report.id);

    return new Promise(async (resolve, reject) =>  {
      setTimeout(() => {
        return reject(new ServiceUnavailableException('Report is running in background!'));
      }, 10000);

      const data = await exportReportJob.finished();
      resolve(data);
    });
  }

  public async runReport(filters, reportId): Promise<string> {
    try {
      if (filters.agents.length > 0 && filters.department) {
        const response = await this._reportServiceDotNet.getReportFromDotNet(
          filters,
          reportId
        );
        
        const path = response.data;
        //* update report entity
        this._updateReport(reportId, ReportStatus.SUCCESSFUL, path);
        
        return path;
      } else {
        throw new NotFoundException(`Not found Agent !!`);
      }
    } catch (error) {
      this._updateReport(reportId, ReportStatus.FAILED, '' , error);
      throw new HttpException(
        {
          status: HttpStatus.BAD_REQUEST,
          error: 'Bad request',
        },
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  private async _updateReport(reportId: string, reportStatus: ReportStatus, path = '', error = {}) {
    const report = await this._reportRepository.findOne(reportId);
    report.path = path;
    report.reportStatus = reportStatus;
    report.error = JSON.stringify(error);
    await report.save();
    return;
  }

  //TODO: query report list here
  async getReports(count: any):Promise<any> {
    const listReport = await getManager()
      .createQueryBuilder(Report,'report')
      .andWhere('report.status = :status',{status: EntityStatus.ACTIVE})
      .orderBy({
        'report.creationTime':'DESC'
      })
      .getMany();
    if(!listReport) throw new NotFoundException(`Not found list Export !!!`);
    const recordLength = 20;
    const startLocation = recordLength*(count-1);
    const listLength = listReport.length;
    if(startLocation + recordLength <= listLength){
      return { length:listLength, listReport: listReport.slice(startLocation,startLocation + recordLength) }
    }else{
      return { length:listLength,listReport: listReport.slice(startLocation) }
    }
  }
}
