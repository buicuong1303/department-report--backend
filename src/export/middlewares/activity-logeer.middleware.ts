import { Injectable } from '@nestjs/common';
import { Request, Response } from 'express';
import { JwtCustomService } from 'src/jwt-custom/jwt-custom.service';
import { LogActivityQueueService } from 'src/queues/log-activity-queue/log-activity-queue.service';
import { extractDataFromRequest } from 'src/utils/extractDataFromRequest';
import { LogType } from 'src/log-activities/enum/log-type.enum';
import { HashTag } from 'src/log-activities/enum/hash-tag.enum';

@Injectable()
export class ActivityLoggerMiddleware {
  constructor(
    private readonly jwtCustomService: JwtCustomService,
    private readonly logActivityServices: LogActivityQueueService,
  ) {}
  use(req: Request, res: Response, next) {
    const { path, params, ip, method, token, data } = extractDataFromRequest(
      req,
    );
    const { department, typeReport } = data;
    const payload = this.jwtCustomService.decode(token);
    let logType = '';
    let message = '';
    let hashTag = '';
    if (typeReport === 'daily') {
      message = 'Export daily report';
      hashTag = HashTag.DAILY_REPORT;
    } else if (typeReport === 'weekly') {
      message = 'Export weekly report';
      hashTag = HashTag.WEEKLY_REPORT;
    } else if (typeReport === 'agent') {
      message = 'Export agent report';
      hashTag = HashTag.AGENT_REPORT;
    } else if (typeReport === 'teamChat') {
      message = 'Export team chat report';
      hashTag = HashTag.TEAM_CHAT_REPORT;
    } else {
      message = '';
      hashTag = 'Unknown';
    }
    logType = LogType.EXPORT;

    const infoActivity = {
      path,
      data,
      ip: ip.slice(ip.lastIndexOf(':') + 1),
      user: {
        userId: payload.id,
        fullName: payload.fullName,
      },
      message,
      method,
      logType,
      hashTag,
    };
    this.logActivityServices.addReportActivity(infoActivity);
    next();
  }
}
