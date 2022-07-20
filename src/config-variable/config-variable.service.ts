import {
  Injectable,
  BadRequestException,
  NotFoundException,
  InternalServerErrorException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ConfigType } from './enum/type.enum';
import { ConfigVariableRepository } from './repository/config-variable.repository';
import * as _ from 'lodash';
import { ConfigDto } from './dto/config-variable.dto';
import { ConfigVariable } from './entity/config-variable.entity';
import { Connection, Not } from 'typeorm';
import { EntityStatus } from 'src/utils/entity-status';

@Injectable()
export class ConfigVariableService {
  constructor(
    @InjectRepository(ConfigVariableRepository)
    private readonly configRepository: ConfigVariableRepository,
    private readonly connection: Connection,
  ) {}

  async addMainLine(
    config: ConfigDto,
    user: any,
    queryRunner: any,
  ): Promise<any> {
    const mainLine = _.assign(new ConfigVariable(), config);
    mainLine.creationUserId = user.id;
    return queryRunner.manager.save(mainLine);
  }

  async updateConfig(config: any, user: any, queryRunner: any): Promise<any> {
    const infoConfig = await this.configRepository.findOne(config.id);
    if (!infoConfig) throw new NotFoundException('Not found config');

    switch (infoConfig.type) {
      case ConfigType.START_WORK: {
        if (
          config.value.match(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9](:[0-5][0-9])?$/)
        ) {
          const newData = _.assign(infoConfig, config);
          newData.lastModifiedUserId = user.id;
          try {
            return queryRunner.manager.save(newData);
          } catch (error) {
            throw new Error('Can not save start work');
          }
        }
        throw new BadRequestException('Invalid time, ex: HH:mm:ss');
      }
      case ConfigType.MAIN_LINE: {
        const newData = _.assign(infoConfig, config);
        newData.lastModifiedUserId = user.id;
        try {
          return queryRunner.manager.save(newData);
        } catch (error) {
          throw new Error('Can not save main line');
        }
      }
      case ConfigType.PART_TIME:
      case ConfigType.FULL_TIME: {
        if (Number.isInteger(+config.value)) {
          const newData = _.assign(infoConfig, config);
          newData.lastModifiedUserId = user.id;
          try {
            return queryRunner.manager.save(newData);
          } catch (error) {
            throw new Error('Can not save part time');
          }
        }
      }
      default: {
        const newData = _.assign(infoConfig, config);
        newData.lastModifiedUserId = user.id;
        try {
          return queryRunner.manager.save(newData);
        } catch (error) {
          throw new Error('Can not save desk phone');
        }
      }
    }
  }

  async updateConfigs(configs: any, user: any): Promise<any> {
    const queryRunner = this.connection.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();
    for (let i = 0; i < configs.length; i++) {
      configs[i].key = configs[i].key.trim();

      if (!configs[i].key)
        throw new BadRequestException('Main line name is require');
      let isExistMainLine = null;
      if (configs[i].id) {
        isExistMainLine = await this.configRepository.findOne({
          where: {
            id: Not(configs[i].id),
            key: configs[i].key,
            status: Not(EntityStatus.DELETE),
          },
        });
      } else {
        isExistMainLine = await this.configRepository.findOne({
          where: {
            key: configs[i].key,
            status: Not(EntityStatus.DELETE),
          },
        });
      }
      if (isExistMainLine)
        throw new ConflictException(`${configs[i].key} has already exist`);
    }

    try {
      const configsUpdate = configs.map(async (config: any) => {
        if (!config.id) {
          //* if no id -> sure this is addMainLine, because different config not add new
          const addMainLine = await this.addMainLine(config, user, queryRunner);
          return addMainLine;
        } else {
          const configUpdate = await this.updateConfig(
            config,
            user,
            queryRunner,
          );
          return configUpdate;
        }
      });

      const newConfigs = await Promise.all(configsUpdate);
      await queryRunner.commitTransaction();

      return newConfigs;
    } catch (error) {
      queryRunner.rollbackTransaction();
      throw new InternalServerErrorException('Some wrong');
    } finally {
      await queryRunner.release();
    }
  }

  async deleteMainLine(id: string, user: any): Promise<any> {
    const mainLine = await this.configRepository.findOne({
      where: {
        id: id,
        status: Not(EntityStatus.DELETE),
      },
    });
    if (!mainLine) throw new NotFoundException('Could not find Main Line');

    mainLine.status = EntityStatus.DELETE;
    mainLine.lastModifiedUserId = user.id;
    await mainLine.save();

    return await this.getConfigs();
  }

  async getConfigs(): Promise<any> {
    try {
      const configs = await this.configRepository.find({
        order: {
          creationTime: 'DESC',
          key: 'ASC',
        },
        where: {
          status: Not(EntityStatus.DELETE),
        },
      });
      if (configs.length === 0)
        throw new NotFoundException('Could not find any config');

      return configs;
    } catch (error) {
      throw new Error('Can not get data');
    }
  }
}
