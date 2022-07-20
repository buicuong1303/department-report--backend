import { Injectable } from '@nestjs/common';
import { InjectGraphQLClient } from '@golevelup/nestjs-graphql-request';
import { GraphQLClient } from 'graphql-request';
import { MONDAY_API_COMPLEXITY } from '../enum/monday-api-complexity';
import { ComplexityService } from './complexity.service';

@Injectable()
export class UpdatesService {
  constructor(
    @InjectGraphQLClient() private readonly _gqlClient: GraphQLClient,
    private readonly _complexityService: ComplexityService,
  ) {}

  public async createUpdate(itemId: string, body: string, author: string) {
    await this._complexityService.checkApiComplexity(
      MONDAY_API_COMPLEXITY.CREATE_UPDATE,
    );

    const query = `mutation {
        create_update (item_id: ${itemId}, body: "${this._enhanceBody(
      body,
      author,
    )}") {
          id
        }
      }
    `;

    const result = await this._gqlClient.request(query);
    return result;
  }

  private _enhanceBody(body: string, author: string) {
    // replace mention
    const splitMention = body.split('@(')[1];

    if (splitMention !== null && splitMention !== undefined) {
      const mentionName = splitMention.slice(0, splitMention.indexOf(')'));
      body = body.replace(
        `@(${mentionName})`,
        `<em><strong><span><span> <span><span><span><span>${mentionName}</span></span></span></span><span></span></span></span></strong></em>`,
      );
    }

    const enhanceBody =
      `<p><span><span><span>Posted by</span></span></span><em><strong><span><span> <span><span><span><span>${author}</span></span></span></span><span></span></span></span></strong></em><span></span></p><hr><p>${body}</p>`
        .replace(/\\/g, '\\' + '\\')
        .replace(/"/g, '\\"');

    return enhanceBody;
  }
}
