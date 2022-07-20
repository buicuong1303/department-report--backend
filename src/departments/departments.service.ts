import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityStatus } from 'src/utils/entity-status';
import { getManager, Not, Raw } from 'typeorm';
import { Department } from './entity/department.entity';
import { DepartmentRepository } from './repository/departments.repository';
import * as _ from 'lodash';
import { Agent } from 'http';
import { AgentDepartmentRepository } from './repository/agent-department.repository';
import { AgentRepository } from 'src/agents/repository/agent.repository';
import { AgentDepartment } from './entity/agent-department.entity';

@Injectable()
export class DepartmentsService {
  constructor(
    @InjectRepository(DepartmentRepository)
    private readonly departmentRepository: DepartmentRepository,
    private readonly agentRepository: AgentRepository,
    private readonly agentDepartmentRepository: AgentDepartmentRepository,
  ) {}

  //* sort agents follow first name
  sortAgentsFollowFirstName(a: any, b: any) {
    if (a.firstName < b.firstName) return -1;
    if (a.firstName > b.firstName) return 1;
    return 0;
  }

  //* create department
  async createDepartment(createDepartmentsDto: any, user: any) {
    const departmentWithName = await this.departmentRepository.findOne({
      where: {
        name: Raw(
          name =>
            `UPPER(REPLACE(${name}, ' ', '')) = '${createDepartmentsDto.name
              .replace(/ +/g, '')
              .toUpperCase()}'`,
        ),
        status: Not(EntityStatus.DELETE),
      },
    });
    if (departmentWithName)
      throw new ConflictException(
        `Department with Name '${createDepartmentsDto.name}' already exists`,
      );

    const department = await _.assign(new Department(), createDepartmentsDto);
    department.creationUserId = user.id;
    department.lastModifiedUserId = user.id;
    department.name = createDepartmentsDto.name.trim();
    return await department.save();
  }

  //* get list department
  async getDepartments(): Promise<any> {
    const departmentsFullInfo = await this.departmentRepository.find({
      relations: ['departmentOfAgent', 'departmentOfAgent.agent'],
      where: {
        status: Not(EntityStatus.DELETE),
      },
    });

    // if (departmentsFullInfo.length === 0) throw new NotFoundException('Could not find any department');

    const departments = departmentsFullInfo.map(item => {
      const department = _.omit(item, ['departmentOfAgent']);
      return {
        ...department,
        agents: item.departmentOfAgent
          .filter(item1 => item1.status !== EntityStatus.DELETE)
          .map(item => item.agent)
          .filter(item2 => item2.status !== EntityStatus.DELETE),
      };
    });

    return departments;
  }

  //* get department follow id
  async getDepartment(departmentId: string) {
    const departmentFullInfo = await this.departmentRepository.findOne({
      relations: ['departmentOfAgent', 'departmentOfAgent.agent'],
      where: {
        id: departmentId,
        status: Not(EntityStatus.DELETE),
      },
    });
    if (!departmentFullInfo)
      throw new NotFoundException('Could not find Department');

    const department = _.omit(departmentFullInfo, ['departmentOfAgent']);

    return {
      ...department,
      agents: departmentFullInfo.departmentOfAgent.map(item => item.agent),
    };
  }

  //* update department
  async updateDepartment(
    departmentId: string,
    updateDepartmentsDto: any,
    user: any,
  ) {
    const departmentWithName = await this.departmentRepository.findOne({
      where: {
        id: Not(departmentId),
        name: Raw(
          name =>
            `UPPER(REPLACE(${name}, ' ', '')) = '${updateDepartmentsDto.name
              .replace(/[ ]+/g, '')
              .toUpperCase()}'`,
        ),
        status: Not(EntityStatus.DELETE),
      },
    });
    if (departmentWithName)
      throw new ConflictException(
        `Department with Name '${updateDepartmentsDto.name}' already exists`,
      );

    const department = await this.departmentRepository.findOne({
      where: {
        id: departmentId,
        status: Not(EntityStatus.DELETE),
      },
    });
    if (!department) throw new NotFoundException(`Could not find Department`);

    await _.assign(department, updateDepartmentsDto);
    department.lastModifiedUserId = user.id;
    department.name = updateDepartmentsDto.name.trim();
    await department.save();

    return await this.getDepartments();
  }

  //* delete department
  async deleteDepartment(departmentId: string, user: any) {
    const department = await this.departmentRepository.findOne({
      where: {
        id: departmentId,
        status: Not(EntityStatus.DELETE),
      },
    });
    if (!department) throw new NotFoundException('Could not find Department');

    department.lastModifiedUserId = user.id;
    department.status = EntityStatus.DELETE;
    await department.save();

    return await this.getDepartments();
  }
  //************************* end department *************************//

  //******************* start agents in department *******************//
  //* add agent to department
  async addAgentToDepartment(
    departmentId: string,
    agentId: string,
    user: any,
  ): Promise<Agent> {
    let agentDepartment = await this.agentDepartmentRepository.findOne({
      relations: ['department', 'agent'],
      where: {
        department: { id: departmentId },
        agent: { id: agentId },
        status: EntityStatus.DELETE,
      },
    });

    if (!agentDepartment) {
      const department = await this.departmentRepository.findOne({
        where: {
          id: departmentId,
        },
      });
      if (!department) throw new NotFoundException('Could not find Department');

      const agent = await this.agentRepository.findOne({
        where: {
          id: agentId,
        },
      });
      if (!agent) throw new NotFoundException('Could not find Agent');

      agentDepartment = new AgentDepartment();
      agentDepartment.department = department;
      agentDepartment.agent = agent;
      // agentDepartment.lastModifiedUserId = user.id;
      await agentDepartment.save();

      return _.omit(agentDepartment, ['department']);
    } else {
      agentDepartment.lastModifiedUserId = user.id;
      agentDepartment.status = EntityStatus.ACTIVE;
      await agentDepartment.save();

      return _.omit(agentDepartment, ['department']);
    }
  }

  //* add agents to department
  async addAgentsToDepartment(departmentId: string, agentIds: any, user: any) {
    const department = await this.departmentRepository.findOne({
      where: {
        id: departmentId,
      },
    });
    if (!department) throw new NotFoundException('Could not find Department');

    const agentsIdPromises = agentIds.map(async (agentId: string) => {
      const agentInDepartment = await this.addAgentToDepartment(
        departmentId,
        agentId,
        user,
      );
      return _.pick(agentInDepartment, ['agent']).agent;
    });

    const agents = await Promise.all(agentsIdPromises);

    return agents;
  }

  //* get agents in department
  async getAgentsInDepartment(departmentId: string) {
    const agentsDepartment = await this.agentDepartmentRepository.find({
      relations: ['department', 'agent'],
      where: {
        department: {
          id: departmentId,
        },
        status: EntityStatus.ACTIVE,
      },
    });

    return agentsDepartment
      .map((item: any) => item.agent)
      .filter(item => {
        if (item.status !== EntityStatus.DELETE) return item;
      })
      .sort(this.sortAgentsFollowFirstName);
  }

  //* delete agent in department
  async deleteAgentInDepartment(
    departmentId: string,
    agentId: string,
    user: any,
  ): Promise<Agent> {
    const agentDepartment = await this.agentDepartmentRepository.findOne({
      relations: ['department', 'agent'],
      where: {
        department: { id: departmentId },
        agent: { id: agentId },
        status: EntityStatus.ACTIVE,
      },
    });
    if (!agentDepartment)
      throw new NotFoundException('Could not find Agent in Department');

    agentDepartment.status = EntityStatus.DELETE;
    agentDepartment.lastModifiedUserId = user.id;
    await agentDepartment.save();

    return _.omit(agentDepartment, ['department']);
  }

  //* update agents in department
  async updateAgentsInDepartment(
    departmentId: string,
    updateAgentsInDepartmentDto: any,
    user: any,
  ) {
    if (updateAgentsInDepartmentDto.agentDeleteIds.length > 0) {
      const deleteAgentInDepartment = updateAgentsInDepartmentDto.agentDeleteIds.map(
        (agentId: string) =>
          this.deleteAgentInDepartment(departmentId, agentId, user),
      );
      await Promise.all(deleteAgentInDepartment);
    }

    if (updateAgentsInDepartmentDto.agentAddIds.length > 0) {
      const addAgentsToDepartment = updateAgentsInDepartmentDto.agentAddIds.map(
        (agentId: string) =>
          this.addAgentToDepartment(departmentId, agentId, user),
      );
      await Promise.all(addAgentsToDepartment);
    }

    return await this.getAgentsInDepartment(departmentId);
  }

  //* delete agents in department
  async deleteAllAgentInDepartment(departmentId: string, user: any) {
    const agentDepartment = await this.agentDepartmentRepository.find({
      relations: ['department', 'agent'],
      where: {
        department: { id: departmentId },
        status: EntityStatus.ACTIVE,
      },
    });

    if (agentDepartment.length > 0) {
      const agentDepartmentDelete = agentDepartment.map(item => {
        item.status = EntityStatus.DELETE;
        item.lastModifiedUserId = user.id;
        return item.save();
      });
      return await Promise.all(agentDepartmentDelete);
    }
  }

  //* get agent by department type
  async getAgentByDepartmentType(type: string) {
    try {
      if (type === 'commercial') {
        const listAgent = [];
        const departmnent = await this.departmentRepository.findOne({
          where: {
            name: 'Commercial',
            status: EntityStatus.ACTIVE,
          },
        });
        if (!departmnent)
          throw new NotFoundException('Not found department Commercial !!');
        const agentDepartment = await this.agentDepartmentRepository.find({
          relations: ['department', 'agent'],
          where: {
            department: { id: departmnent.id },
            status: EntityStatus.ACTIVE,
          },
        });
        agentDepartment.forEach(item => {
          listAgent.push(item.agent);
        });
        return listAgent;
      }
      if (type === 'personal') {
        const listAgent = [];
        const departmnent = await this.departmentRepository.findOne({
          where: {
            name: 'Personal',
            status: EntityStatus.ACTIVE,
          },
        });
        if (!departmnent)
          throw new NotFoundException('Not found department Personal !!');
        const agentDepartment = await this.agentDepartmentRepository.find({
          relations: ['department', 'agent'],
          where: {
            department: { id: departmnent.id },
            status: EntityStatus.ACTIVE,
          },
        });
        agentDepartment.forEach(item => {
          listAgent.push(item.agent);
        });
        return listAgent;
      }
      if (type === 'hlt') {
        const departmnent = await this.departmentRepository.find({
          where: [
            { name: 'Health', status: EntityStatus.ACTIVE },
            { name: 'Life', status: EntityStatus.ACTIVE },
            { name: 'Tax', status: EntityStatus.ACTIVE },
          ],
        });
        if (departmnent.length === 3) {
          const listAgent = [];
          const agentExisted = [];
          const agentDepartment = await this.agentDepartmentRepository.find({
            relations: ['department', 'agent'],
            where: [
              {
                department: { id: departmnent[0].id },
                status: EntityStatus.ACTIVE,
              },
              {
                department: { id: departmnent[1].id },
                status: EntityStatus.ACTIVE,
              },
              {
                department: { id: departmnent[2].id },
                status: EntityStatus.ACTIVE,
              },
            ],
          });
          agentDepartment.forEach(item => {
            if (
              !agentExisted.includes(item.agent.id) &&
              item.agent.status === EntityStatus.ACTIVE &&
              item.agent.isPrimary
            ) {
              listAgent.push(item.agent);
              agentExisted.push(item.agent.id);
            }
          });
          return listAgent;
        } else {
          throw new NotFoundException('Not found department !!');
        }
      }
    } catch (err) {
      throw new Error('Can not get data');
    }
  }
}
