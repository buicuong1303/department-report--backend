import { Injectable } from '@nestjs/common';
import { InjectGraphQLClient } from '@golevelup/nestjs-graphql-request';
import { GraphQLClient } from 'graphql-request';
import { MONDAY_API_COMPLEXITY } from '../enum/monday-api-complexity';
import { ComplexityService } from './complexity.service';

@Injectable()
export class ItemsService {
  constructor(
    @InjectGraphQLClient() private readonly _gqlClient: GraphQLClient,
    private readonly _complexityService: ComplexityService,
  ) {}

  public async createItem(itemName: string, boardId: number, groupId: string) {
    await this._complexityService.checkApiComplexity(
      MONDAY_API_COMPLEXITY.CREATE_ITEM,
    );

    const query = `mutation {
      create_item (board_id: ${boardId}, group_id: "${groupId}", item_name: "${itemName.replace(/\\/g, '\\' + '\\').replace(/"/g, '\\"')}") {
        id
      }
    }
  `;

    const result = await this._gqlClient.request(query);
    return result;
  }

  public async createSubItem(parentItemId: number, subItemName: string) {
    await this._complexityService.checkApiComplexity(
      MONDAY_API_COMPLEXITY.CREATE_SUB_ITEM,
    );

    const query = `mutation {
          create_subitem (parent_item_id: ${parentItemId}, item_name: "${subItemName.replace(/\\/g, '\\' + '\\').replace(/"/g, '\\"')}") {
            id,
            board {
              id,
              columns {
                id,
                title
              }
            }
          }
        }
      `;

    const result = await this._gqlClient.request(query);
    return result;
  }

  public async getItem(id: number, ) {
    await this._complexityService.checkApiComplexity(
      MONDAY_API_COMPLEXITY.GET_ITEM,
    );

    const query = `query {
      items (ids: [${id}]) {
        name
        column_values {
          title
          value
        }
        group {
          title
        }
      }
    }
  `;

    const result = await this._gqlClient.request(query);
    return result;
  }
}
