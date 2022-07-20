/* eslint-disable @typescript-eslint/no-unused-vars */
import { HttpService, Injectable } from '@nestjs/common';
import { InjectGraphQLClient } from '@golevelup/nestjs-graphql-request';
import { GraphQLClient } from 'graphql-request';
import * as FormData from 'form-data';
import * as config from 'config';
import { MONDAY_API_COMPLEXITY } from '../enum/monday-api-complexity';
import { ComplexityService } from './complexity.service';
import { trycat } from '../../utils/trycat';

const mondayConfig = config.get('monday');

@Injectable()
export class FilesService {
  constructor(
    @InjectGraphQLClient() private readonly _gqlClient: GraphQLClient,
    private readonly _httpService: HttpService,
    private readonly _complexityService: ComplexityService,
  ) {}

  public async addFileToAnUpdate(
    updateId: number,
    fileName: string,
    fileUrl: string,
  ) {
    try {
      await this._complexityService.checkApiComplexity(
        MONDAY_API_COMPLEXITY.UPDATE_LOAD_FILE,
      );

      const query = `mutation ($updateId: Int!, $file: File!) {
        add_file_to_update (update_id: $updateId, file: $file) {
          id
        }
      }
    `;

      const downloadFileData = await this._httpService
        .get(fileUrl, { responseType: 'stream' })
        .toPromise();

      //TODO: error JSON.stringify
      const variables = JSON.stringify({
        updateId,
      });

      const fileTemp = JSON.stringify({ temp: 'variables.file' });
      const formData = new FormData();
      formData.append('query', query);
      formData.append('variables', variables);
      formData.append('temp', downloadFileData['data'], fileName);
      formData.append('map', fileTemp);

      const [uploadFileData, uploadFileError] = await trycat(
        this._httpService
          .post(mondayConfig['endpointFile'], formData, {
            headers: {
              Authorization: mondayConfig['token'],
              ...formData.getHeaders(),
            },
          })
          .toPromise(),
      );

      if (uploadFileError) {
        //TODO: need save log
        console.log(JSON.stringify(uploadFileError));
      }

      return;
    } catch (error) {
      console.log('retry post attachment');
      await this.addFileToAnUpdate(updateId, fileName, fileUrl);
    }
  }

  public async addFileToAFileColumnValue(
    itemId: number,
    columnId: string,
    fileName: string,
    fileUrl: string,
  ) {
    try {
      await this._complexityService.checkApiComplexity(
        MONDAY_API_COMPLEXITY.ADD_FILE_TO_FILE_COLUMN_VALUE,
      );

      const query = `mutation($itemId: Int!, $columnId: String!, $file: File!) {
          add_file_to_column (item_id: $itemId, column_id: $columnId, file: $file) {
            id
          }
        }
      `;

      const downloadFileData = await this._httpService
        .get(fileUrl, { responseType: 'stream' })
        .toPromise();

      const variables = JSON.stringify({
        itemId,
        columnId,
      });

      const fileTemp = JSON.stringify({ temp: 'variables.file' });
      const formData = new FormData();
      formData.append('query', query);
      formData.append('variables', variables);
      formData.append('temp', downloadFileData['data'], fileName);
      formData.append('map', fileTemp);

      const [uploadFileData, uploadFileError] = await trycat(
        this._httpService
          .post(mondayConfig['endpointFile'], formData, {
            headers: {
              Authorization: mondayConfig['token'],
              ...formData.getHeaders(),
            },
          })
          .toPromise(),
      );

      if (uploadFileError) {
        //TODO: need save log
        console.log(JSON.stringify(uploadFileError));
      }

      return;
    } catch (error) {
      console.log('retry post attachment');
      await this.addFileToAFileColumnValue(itemId, columnId, fileName, fileUrl);
    }
  }
}
