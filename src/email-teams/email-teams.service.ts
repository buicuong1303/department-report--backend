import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { EntityStatus } from 'src/utils/entity-status';
import { EmailTeams } from './entity/email.entity';
import * as _ from 'lodash';
import { InjectRepository } from '@nestjs/typeorm';
import { EmailTeamsRepository } from './repository/email-teams.repository';
import { Not, Raw } from 'typeorm';
import { CreateEmailTeamsDto } from './dto/create-email-team.dto';
import { UpdateEmailTeamsDto } from './dto/update-email-team.dto';

@Injectable()
export class EmailTeamsService {
  constructor(
    @InjectRepository(EmailTeamsRepository)
    private readonly emailTeamsRepository: EmailTeamsRepository,
  ) {}

  //* create email team
  async createEmailTeam(user: any, createEmailTeamsDto: CreateEmailTeamsDto) {
    Object.keys(createEmailTeamsDto).forEach(key => {
      if (key) createEmailTeamsDto[key] = createEmailTeamsDto[key].trim();
    });
    if (!createEmailTeamsDto.displayName)
      throw new BadRequestException('Display name is required');
    const emailTeamWithDisplayName = await this.emailTeamsRepository.findOne({
      where: {
        displayName: Raw(
          displayName =>
            `UPPER(REPLACE(${displayName}, ' ', '')) = '${createEmailTeamsDto.displayName
              .replace(/[ ]+/g, '')
              .toUpperCase()}'`,
        ),
        status: Not(EntityStatus.DELETE),
      },
    });
    if (emailTeamWithDisplayName)
      throw new ConflictException(
        `Email Team with Display Name '${createEmailTeamsDto.displayName}' already exists`,
      );

    const emailTeamWithEmailAddress = await this.emailTeamsRepository.findOne({
      where: {
        emailAddress: Raw(
          emailAddress =>
            `UPPER(REPLACE(${emailAddress}, ' ', '')) = '${createEmailTeamsDto.emailAddress
              .replace(/[ ]+/g, '')
              .toUpperCase()}'`,
        ),
        status: Not(EntityStatus.DELETE),
      },
    });
    if (emailTeamWithEmailAddress)
      throw new ConflictException(
        `Email Team with Email Address '${createEmailTeamsDto.emailAddress}' already exists`,
      );

    const emailTeam = await _.assign(new EmailTeams(), createEmailTeamsDto);
    emailTeam.creationUserId = user.id;
    emailTeam.lastModifiedUserId = user.id;
    return await emailTeam.save();
  }

  //* get list email team
  async getEmailTeams() {
    const emailTeams = await this.emailTeamsRepository.find({
      order: {
        creationTime: 'DESC',
        displayName: 'ASC',
      },
      where: {
        status: Not(EntityStatus.DELETE),
      },
    });
    if (emailTeams.length === 0)
      throw new NotFoundException('Could not find any Email Team');

    return emailTeams;
  }

  //* get email team follow id
  async getEmailTeam(id: string) {
    const emailTeam = await this.emailTeamsRepository.findOne({
      where: {
        id: id,
        status: Not(EntityStatus.DELETE),
      },
    });
    if (!emailTeam) throw new NotFoundException('Could not find Email Team');

    return emailTeam;
  }

  //* update email team
  async updateEmailTeam(
    id: string,
    user: any,
    updateEmailTeamsDto: UpdateEmailTeamsDto,
  ) {
    Object.keys(updateEmailTeamsDto).forEach(key => {
      if (key) updateEmailTeamsDto[key] = updateEmailTeamsDto[key].trim();
    });
    if (!updateEmailTeamsDto.displayName)
      throw new BadRequestException('Display name is required');

    const emailTeamWithDisplayName = await this.emailTeamsRepository.findOne({
      where: {
        id: Not(id),
        displayName: Raw(
          displayName =>
            `UPPER(REPLACE(${displayName}, ' ', '')) = '${updateEmailTeamsDto.displayName
              .replace(/[ ]+/g, '')
              .toUpperCase()}'`,
        ),
        status: Not(EntityStatus.DELETE),
      },
    });
    if (emailTeamWithDisplayName)
      throw new ConflictException(
        `Email Team with Display Name '${updateEmailTeamsDto.displayName}' already exists`,
      );

    const emailTeamWithEmailAddress = await this.emailTeamsRepository.findOne({
      where: {
        id: Not(id),
        emailAddress: Raw(
          emailAddress =>
            `UPPER(REPLACE(${emailAddress}, ' ', '')) = '${updateEmailTeamsDto.emailAddress
              .replace(/[ ]+/g, '')
              .toUpperCase()}'`,
        ),
        status: Not(EntityStatus.DELETE),
      },
    });
    if (emailTeamWithEmailAddress)
      throw new ConflictException(
        `Email Team with Email Address '${updateEmailTeamsDto.emailAddress}' already exists`,
      );

    const emailTeam = await this.getEmailTeam(id);
    if (!emailTeam) throw new NotFoundException(`Could not find Email Team`);

    await _.assign(emailTeam, updateEmailTeamsDto);
    emailTeam.lastModifiedUserId = user.id;
    await emailTeam.save();

    return await this.getEmailTeams();
  }

  //* delete email team
  async deleteEmailTeam(id: string, user: any) {
    const emailTeam = await this.getEmailTeam(id);
    if (!emailTeam) throw new NotFoundException('Could not find Email Team');

    emailTeam.lastModifiedUserId = user.id;
    emailTeam.status = EntityStatus.DELETE;
    await emailTeam.save();

    return await this.getEmailTeams();
  }
}
