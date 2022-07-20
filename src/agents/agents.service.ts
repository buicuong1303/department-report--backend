import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityStatus } from 'src/utils/entity-status';
import { Not } from 'typeorm';
import { AgentRepository } from './repository/agent.repository';
import * as _ from 'lodash';
import { Agent } from './entity/agent.entity';
import { DepartmentRepository } from 'src/departments/repository/departments.repository';
import { AgentDepartmentRepository } from 'src/departments/repository/agent-department.repository';
import { AgentDepartment } from 'src/departments/entity/agent-department.entity';
import { UpdateAgentsDto } from './dto/update-agent.dto';
import { CreateAgentsDto } from './dto/create-agent.dto';

@Injectable()
export class AgentsService {
  constructor(
    @InjectRepository(AgentRepository)
    private readonly agentRepository: AgentRepository,
    private readonly departmentRepository: DepartmentRepository,
    private readonly agentDepartmentRepository: AgentDepartmentRepository,
  ) {}

  //* sort departments follow name
  sortDepartmentsFollowName(a: any, b: any) {
    if (a.name < b.name) return -1;
    if (a.name > b.name) return 1;
    return 0;
  }

  //* create agent
  async createAgent(createAgentsDto: CreateAgentsDto, user: any) {
    if (!createAgentsDto.firstName)
      throw new BadRequestException('First name is required');
    const oldAgent = await this.agentRepository.findOne({
      where: {
        firstName:
          createAgentsDto.firstName && createAgentsDto.firstName.trim(),
        lastName: createAgentsDto.lastName && createAgentsDto.lastName.trim(),
        firstNameSpecial:
          createAgentsDto.firstNameSpecial &&
          createAgentsDto.firstNameSpecial.trim(),
        status: Not(EntityStatus.DELETE),
      },
    });
    if (oldAgent)
      throw new BadRequestException(
        `Agent with First Name '${createAgentsDto.firstName}' already exists`,
      );
    try {
      const newAgent = await _.assign(new Agent(), createAgentsDto);
      newAgent.creationUserId = user.id;
      newAgent.lastModifiedUserId = user.id;
      return await newAgent.save();
    } catch (error) {
      throw new Error('Can not create agent');
    }
  }

  //* get list agent
  async getAgents() {
    const agentsFullInfo = await this.agentRepository.find({
      relations: ['departmentOfAgent', 'departmentOfAgent.department'],
      order: {
        creationTime: 'DESC',
        firstName: 'ASC',
      },
      where: {
        status: Not(EntityStatus.DELETE),
      },
    });
    if (agentsFullInfo.length === 0)
      throw new NotFoundException('Could not find any Agent');

    const agents = agentsFullInfo.map(item => {
      const agent = _.omit(item, ['departmentOfAgent']);
      return {
        ...agent,
        departments: item.departmentOfAgent
          .filter(item1 => item1.status !== EntityStatus.DELETE)
          .map(item => item.department)
          .filter(item2 => item2.status !== EntityStatus.DELETE),
      };
    });
    return agents;
  }

  //* get agent follow id
  async getAgent(agentId: string) {
    const agentFullInfo = await this.agentRepository.findOne({
      relations: ['departmentOfAgent', 'departmentOfAgent.department'],
      where: {
        id: agentId,
        status: Not(EntityStatus.DELETE),
      },
    });
    if (!agentFullInfo) throw new NotFoundException('Could not find Agent');

    const agent = _.omit(agentFullInfo, ['departmentOfAgent']);
    return {
      ...agent,
      departments: agentFullInfo.departmentOfAgent.map(item => item.department),
    };
  }

  //* update agent
  async updateAgent(
    agentId: string,
    updateAgentsDto: UpdateAgentsDto,
    user: any,
  ) {
    Object.keys(updateAgentsDto).forEach(key => {
      if (!['isPrimary', 'oldDepartments', 'newDepartments'].includes(key))
        updateAgentsDto[key] =
          updateAgentsDto[key] && updateAgentsDto[key].trim();
    });

    if (!updateAgentsDto.firstName) {
      throw new BadRequestException('First name is required');
    }
    if (updateAgentsDto.isPrimary && !updateAgentsDto.originalName)
      throw new BadRequestException('Original name is required');
    const agent = await this.agentRepository.findOne({
      where: {
        id: agentId,
        status: Not(EntityStatus.DELETE),
      },
    });

    if (!agent) throw new NotFoundException(`Could not find Agent`);

    const oldAgent = await this.agentRepository.findOne({
      where: {
        firstName:
          updateAgentsDto.firstName && updateAgentsDto.firstName.trim(),
        firstNameSpecial:
          updateAgentsDto.firstNameSpecial &&
          updateAgentsDto.firstNameSpecial.trim(),
        id: Not(agentId),
        status: Not(EntityStatus.DELETE),
      },
    });
    if (oldAgent)
      throw new ConflictException(
        `Agent with First Name '${updateAgentsDto.firstName}' already exists`,
      );
    try {
      await _.assign(agent, updateAgentsDto);
      agent.lastModifiedUserId = user.id;
      await agent.save();

      return await this.getAgents();
    } catch (error) {
      throw new Error('Can not update agent');
    }
  }

  //* delete agent
  async deleteAgent(agentId: string, user: any) {
    const agent = await this.agentRepository.findOne({
      where: {
        id: agentId,
        status: Not(EntityStatus.DELETE),
      },
    });
    if (!agent) throw new NotFoundException('Could not find Agent');
    try {
      agent.lastModifiedUserId = user.id;
      agent.status = EntityStatus.DELETE;
      await agent.save();

      return await this.getAgents();
    } catch (error) {
      throw new Error('Can not delete agent');
    }
  }
  //************************* end agent *************************//

  //******************* start departments in agent *******************//
  //* add department to agent
  async addDepartmentToAgent(
    agentId: string,
    departmentId: string,
    user: any,
  ): Promise<Agent> {
    try {
      let agentDepartment = await this.agentDepartmentRepository.findOne({
        relations: ['agent', 'department'],
        where: {
          agent: { id: agentId },
          department: { id: departmentId },
          status: EntityStatus.DELETE,
        },
      });

      if (!agentDepartment) {
        const agent = await this.agentRepository.findOne({
          where: {
            id: agentId,
          },
        });
        if (!agent) throw new NotFoundException('Could not find Agent');

        const department = await this.departmentRepository.findOne({
          where: {
            id: departmentId,
          },
        });
        if (!department)
          throw new NotFoundException('Could not find Department');

        agentDepartment = new AgentDepartment();
        agentDepartment.department = department;
        agentDepartment.agent = agent;
        agentDepartment.lastModifiedUserId = user.id;
        await agentDepartment.save();

        return _.omit(agentDepartment, ['agent']);
      } else {
        agentDepartment.lastModifiedUserId = user.id;
        agentDepartment.status = EntityStatus.ACTIVE;
        await agentDepartment.save();

        return _.omit(agentDepartment, ['agent']);
      }
    } catch (error) {
      throw new Error('Can not add department to agent');
    }
  }

  //* add departments to agent
  async addDepartmentsToAgent(agentId: string, departmentIds: any, user: any) {
    try {
      const agent = await this.agentRepository.findOne({
        where: {
          id: agentId,
        },
      });
      if (!agent) throw new NotFoundException('Could not find Agent');

      const departmentsIdPromises = departmentIds.map(
        async (departmentId: string) => {
          const departmentInAgent = await this.addDepartmentToAgent(
            agentId,
            departmentId,
            user,
          );
          return _.pick(departmentInAgent, ['department']).department;
        },
      );

      const departments = await Promise.all(departmentsIdPromises);

      return departments;
    } catch (error) {
      throw new Error('Can not add departments to agent');
    }
  }

  //* get departments in agent
  async getDepartmentsInAgent(agentId: string) {
    const agentsDepartment = await this.agentDepartmentRepository.find({
      relations: ['agent', 'department'],
      where: {
        agent: {
          id: agentId,
        },
        status: EntityStatus.ACTIVE,
      },
    });

    return agentsDepartment
      .map((item: any) => item.department)
      .filter(item => {
        if (item.status !== EntityStatus.DELETE) return item;
      })
      .sort(this.sortDepartmentsFollowName);
  }

  //* delete department in agent
  async deleteDepartmentInAgent(
    agentId: string,
    departmentId: string,
    user: any,
  ): Promise<Agent> {
    try {
      const agentDepartment = await this.agentDepartmentRepository.findOne({
        relations: ['agent', 'department'],
        where: {
          agent: { id: agentId },
          department: { id: departmentId },
          status: EntityStatus.ACTIVE,
        },
      });
      if (!agentDepartment)
        throw new NotFoundException('Could not find Department in Agent');

      agentDepartment.status = EntityStatus.DELETE;
      agentDepartment.lastModifiedUserId = user.id;
      await agentDepartment.save();

      return _.omit(agentDepartment, ['agent']);
    } catch (error) {
      throw new Error("Can not remove agent's department");
    }
  }

  //* update departments in agent
  async updateDepartmentsInAgent(
    agentId: string,
    updateDepartmentsInAgentDto: any,
    user: any,
  ) {
    try {
      if (updateDepartmentsInAgentDto.departmentDeleteIds.length > 0) {
        const deleteDepartmentInAgent = updateDepartmentsInAgentDto.departmentDeleteIds.map(
          (departmentId: string) =>
            this.deleteDepartmentInAgent(agentId, departmentId, user),
        );
        await Promise.all(deleteDepartmentInAgent);
      }

      if (updateDepartmentsInAgentDto.departmentAddIds.length > 0) {
        const addDepartmentToAgent = updateDepartmentsInAgentDto.departmentAddIds.map(
          (departmentId: string) =>
            this.addDepartmentToAgent(agentId, departmentId, user),
        );
        await Promise.all(addDepartmentToAgent);
      }

      return await this.getDepartmentsInAgent(agentId);
    } catch (error) {
      throw new Error("Cant not update agent's departments");
    }
  }

  //* delete departments in agent
  async deleteAllDepartmentInAgent(agentId: string, user: any) {
    try {
      const agentDepartment = await this.agentDepartmentRepository.find({
        relations: ['agent', 'department'],
        where: {
          agent: { id: agentId },
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
    } catch (error) {
      throw new Error("Can not delete all agent's departments");
    }
  }
}
