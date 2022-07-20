import { Injectable } from '@nestjs/common';
import { InjectGraphQLClient } from '@golevelup/nestjs-graphql-request';
import { GraphQLClient } from 'graphql-request';
import { MONDAY_API_COMPLEXITY } from '../enum/monday-api-complexity';
import { ComplexityService } from './complexity.service';
import { Board_Subscriber_Kind } from '../../utils/board-subscriber-kind';

@Injectable()
export class UsersService {
  constructor(
    @InjectGraphQLClient() private readonly _gqlClient: GraphQLClient,
    private readonly _complexityService: ComplexityService,
  ) {}

  public async getUsers() {
    await this._complexityService.checkApiComplexity(
      MONDAY_API_COMPLEXITY.GET_BOARDS,
    );

    const query = `query {
      users (kind: non_guests) {
        id,
        name,
        email,
        phone
      }
    }`;

    const result = await this._gqlClient.request(query);
    return result;
  }

  public async addSubscribersToBoard(
    boardId: number,
    userIds: number[],
    kind: Board_Subscriber_Kind,
  ) {
    await this._complexityService.checkApiComplexity(
      MONDAY_API_COMPLEXITY.ADD_SUBSCRIBERS_TO_BOARD,
    );

    const query = `mutation {
      add_subscribers_to_board (board_id: ${boardId}, user_ids: [${userIds}], kind: ${kind}) {
        id
      }
    }
  `;

    const result = await this._gqlClient.request(query);
    return result;
  }
}
