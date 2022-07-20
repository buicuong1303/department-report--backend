import { Injectable } from '@nestjs/common';
import { InjectGraphQLClient } from '@golevelup/nestjs-graphql-request';
import { GraphQLClient } from 'graphql-request';
import { MONDAY_API_COMPLEXITY } from '../enum/monday-api-complexity';
import { ComplexityService } from './complexity.service';

@Injectable()
export class GroupsService {
  constructor(
    @InjectGraphQLClient() private readonly _gqlClient: GraphQLClient,
    private readonly _complexityService: ComplexityService,
  ) {}

  public async duplicateGroup(
    boardId: number,
    groupId: string,
    addToTop = false,
    groupTitle: string,
  ) {
    await this._complexityService.checkApiComplexity(
      MONDAY_API_COMPLEXITY.DUPLICATE_GROUP,
    );

    const query = `mutation {
      duplicate_group(board_id:${boardId}, group_id: "${groupId}", add_to_top: ${addToTop}, group_title: "${groupTitle}") {
        id
      }
    }
    `;

    const result = await this._gqlClient.request(query);
    return result;
  }

  public async deleteGroup(boardId: number, groupId: string) {
    await this._complexityService.checkApiComplexity(
      MONDAY_API_COMPLEXITY.DELETE_GROUP,
    );

    const query = `mutation {
      delete_group(board_id:${boardId}, group_id: "${groupId}") {
        id,
        deleted
      }
    }
    `;

    const result = await this._gqlClient.request(query);
    return result;
  }
}
