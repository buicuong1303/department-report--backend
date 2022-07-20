import { Injectable } from '@nestjs/common';
import { InjectGraphQLClient } from '@golevelup/nestjs-graphql-request';
import { GraphQLClient } from 'graphql-request';
import { ComplexityService } from './complexity.service';
import { MONDAY_API_COMPLEXITY } from '../enum/monday-api-complexity';

@Injectable()
export class BoardsService {
  constructor(
    @InjectGraphQLClient() private readonly _gqlClient: GraphQLClient,
    private readonly _complexityService: ComplexityService,
  ) {}

  public async getItems(boardId: number) {
    await this._complexityService.checkApiComplexity(
      MONDAY_API_COMPLEXITY.GET_BOARDS,
    );

    const query = `query {
      boards (ids: ${boardId}) {
        id,
        name,
        items(limit: 200) {
          id
          name
          column_values {
            id
            title
            value,
            type
          },
          group {
            id,
            title
          }
        }
      }
    }`;

    const result = await this._gqlClient.request(query);
    return result;
  }

  public async getColumns(boardId: number) {
    await this._complexityService.checkApiComplexity(
      MONDAY_API_COMPLEXITY.GET_BOARD_COLUMNS,
    );

    const query = `query {
      boards (ids: ${boardId}) {
        id
        columns {
          id
          title
          type
        }
      }
    }`;

    const result = await this._gqlClient.request(query);
    return result;
  }

  public async getColumnsAndGroups(boardId: number) {
    await this._complexityService.checkApiComplexity(
      MONDAY_API_COMPLEXITY.GET_BOARD_COLUMN_GROUPS,
    );

    const query = `query {
      boards (ids: ${boardId}) {
        id
        columns {
          id
          title
          type
        }
        groups {
          id
          title
          color
        }
      }
    }`;

    const result = await this._gqlClient.request(query);
    return result;
  }

  public async duplicateBoard(
    boardId: number,
    duplicateType: string,
    boardName: string,
    workspaceId: number,
    folderId: number,
    keepSubscribers: boolean,
  ) {
    await this._complexityService.checkApiComplexity(
      MONDAY_API_COMPLEXITY.DUPLICATE_BOARD,
    );

    const query = `mutation {
      duplicate_board(board_id:${boardId}, duplicate_type: ${duplicateType}, board_name: "${boardName}", workspace_id: ${workspaceId}, folder_id: ${folderId}, keep_subscribers: ${keepSubscribers}) {
        board
        {
          id
          columns {
            id
            title
            type
          }
          groups {
            id
            title
            color
          }
        }
      }
    }
    `;

    const result = await this._gqlClient.request(query);
    return result;
  }

  public async getActivities(boardId: number, from: any, to: any, pageIndex: any) {
    await this._complexityService.checkApiComplexity(
      MONDAY_API_COMPLEXITY.GET_ACTIVITIES,
    );
    const query = `query {
      boards (ids: ${boardId}) {
        activity_logs (from: "${from}", to: "${to}", limit: 1000, page:${pageIndex}) {
            id
            event
            data
            created_at
          }
        }
      }`;

    const result = await this._gqlClient.request(query);
    return result;
  }
}
