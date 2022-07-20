/* eslint-disable @typescript-eslint/no-var-requires */

import { Logger, ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { join } from 'path';
import { AppModule } from './app.module';
import * as cookieParser from 'cookie-parser';
import * as config from 'config';
import { router as BullBoardUI } from 'bull-board';

const numCPUs = require('os').cpus().length;
const cluster = require('cluster');

async function bootstrap() {
  const logger = new Logger('bootstrap');
  const serverConfig = config.get('server');
  const corsConfig = config.get('cors');
  const port = process.env.PORT || serverConfig.port;
  logger.log(`Application run on port: ${port}`);

  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  app.useGlobalPipes(new ValidationPipe({ forbidUnknownValues: false }));

  //use middleware
  app.use(cookieParser());

  //CORS
  app.enableCors({
    // origin: [corsConfig.frontend]
  });

  //static access
  app.useStaticAssets(join(__dirname, '..', 'public'), { prefix: '/public/' });

  // bull queue monitoring
  app.use('/queues/monitoring-ui', BullBoardUI);

  await app.listen(process.env.PORT || port);

  //* disable because conflict port in multiple instance
  // if (process.env.NODE_ENV === 'production') {
  //   if (cluster.isMaster) {
  //     // console.log(`Master ${process.pid} is running`);

  //     // Fork workers.
  //     for (let i = 0; i < numCPUs; i++) {
  //       cluster.fork();
  //     }

  //     cluster.on('exit', (worker, code, signal) => {
  //       // console.log(`worker ${worker.process.pid} died`);
  //     });
  //   } else {
  //     await app.listen(process.env.PORT || port);

  //     // console.log(`Worker ${process.pid} started`);
  //   }
  // }
}
bootstrap();
