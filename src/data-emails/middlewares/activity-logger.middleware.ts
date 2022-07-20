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
    const payload = this.jwtCustomService.decode(token);
    let logType = '';
    let message = '';
    if (method.toLocaleLowerCase() == 'delete') {
      message = `Delete email activity`;
      logType = LogType.DELETE;
    } else {
      message = `Update email activity`;
      logType = LogType.UPDATE;
    }

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
      hashTag: HashTag.EMAIL_DATA,
    };
    this.logActivityServices.addDataCenterActivity(infoActivity);
    next();
  }
}
