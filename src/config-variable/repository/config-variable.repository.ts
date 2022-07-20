import { Repository, EntityRepository } from 'typeorm';
import { ConfigVariable } from '../entity/config-variable.entity';

@EntityRepository(ConfigVariable)
export class ConfigVariableRepository extends Repository<ConfigVariable> {}
