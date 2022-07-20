import { TypeOrmModuleOptions } from '@nestjs/typeorm';
import * as config from 'config';

const dbConfig = config.get('db');

export const typeOrmConfig: TypeOrmModuleOptions = {
  type: dbConfig.type,
  host: process.env.DB_HOST || dbConfig.host,
  port: process.env.DB_PORT || dbConfig.port,
  username: process.env.DB_USERNAME || dbConfig.username,
  password: process.env.DB_PASSWORD || dbConfig.password,
  database: process.env.DB_DATABASE || dbConfig.database,

  //TODO: Because _dirname is path when app run (es5 compile *entity.ts to *entity.js in dist folder), so start at dist folder.
  //TODO: Entity path get from dist to entity folder in each module
  //TODO: This file from dist/config
  entities: [__dirname + '/../**/entity/*.entity{.ts,.js}'],

  synchronize: process.env.TYPEORM_SYNC || dbConfig.synchronize,
};
