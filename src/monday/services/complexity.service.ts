/* eslint-disable @typescript-eslint/no-unused-vars */
import { Injectable } from '@nestjs/common';
import { InjectGraphQLClient } from '@golevelup/nestjs-graphql-request';
import { GraphQLClient } from 'graphql-request';
import { ComplexityDto } from '../dto/complexity.dto';
import { MONDAY_API_COMPLEXITY } from '../enum/monday-api-complexity';
import { delay } from '../../utils/delay';

let complexity = 1000000;

@Injectable()
export class ComplexityService {
  constructor(
    @InjectGraphQLClient() private readonly _gqlClient: GraphQLClient,
  ) {}

  public async setInternalComplexity(newComplexity: number) {
    complexity = newComplexity;
    return complexity;
  }

  public async getInternalComplexity() {
    return complexity;
  }

  public async getExternalComplexity() {
    const query = `query {
      complexity {
        before,
        query,
        after,
        reset_in_x_seconds
      }
      boards (limit: 1) {
        id
      }
    }`;

    const result: any = await this._gqlClient.request(query);

    await this.setInternalComplexity(result.complexity.after);

    return result.complexity;
  }

  public async checkApiComplexity(apiComplexity: number) {
    if (complexity < apiComplexity) {
      if (complexity < MONDAY_API_COMPLEXITY.GET_COMPLEXITY) {
        await delay(60000);
      }

      const externalComplexity: ComplexityDto =
        await this.getExternalComplexity();

      if (externalComplexity.before < apiComplexity) {
        await delay(externalComplexity.reset_in_x_seconds * 1000);
        await this.getExternalComplexity();
      }
    }

    const newComplexity = await this.setInternalComplexity(
      complexity - apiComplexity,
    );

    return;
  }
}
