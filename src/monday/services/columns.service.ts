import { Injectable } from '@nestjs/common';
import { InjectGraphQLClient } from '@golevelup/nestjs-graphql-request';
import { GraphQLClient } from 'graphql-request';
import { ComplexityService } from './complexity.service';
import { MONDAY_API_COMPLEXITY } from '../enum/monday-api-complexity';

@Injectable()
export class ColumnsService {
  constructor(
    @InjectGraphQLClient() private readonly _gqlClient: GraphQLClient,
    private readonly _complexityService: ComplexityService,
  ) {}

  public async changeMultipleColumnValue(
    boardId: number,
    itemId: number,
    columnValues: string,
  ) {
    await this._complexityService.checkApiComplexity(
      MONDAY_API_COMPLEXITY.CHANGE_MULTIPLE_COLUMN_VALUE,
    );

    const query = `mutation change_multiple_column_values($boardId: Int!, $itemId: Int!, $columnValues: JSON!) {
      change_multiple_column_values(board_id: $boardId, item_id: $itemId, column_values: $columnValues) {
        id,
        id,
        name,
        column_values {
          id
          value
        }
      }
    }
    `;

    const variables = {
      boardId: boardId,
      itemId: itemId,
      columnValues,
    };

    const result = await this._gqlClient.request(query, variables);
    return result;
  }
}
