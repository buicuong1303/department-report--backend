import { Controller, Get, Post, Query, Req, Res } from '@nestjs/common';
import { Response } from 'express';
import * as moment from 'moment-timezone';
import { MondayService } from './monday.service';
@Controller('monday')
export class MondayController {
  constructor(private readonly mondayService: MondayService) {
    //#region
    // setTimeout(() => {
    //   const test = {
    //     data: {
    //       boards: [
    //         {
    //           activity_logs: [
    //             {
    //               id: 'cdc333eb-6612-479b-a599-c6549ccca159',
    //               event: 'move_pulse_into_group',
    //               data: '{"board_id":1483255419,"group_id":"new_group","source_board":{"id":1483255419,"name":"IC- Health, Life, Tax Dept","kind":"share"},"source_group":{"id":"topics","title":"Need to Call Back","color":"#CAB641","is_top_group":false},"dest_group":{"id":"new_group","title":"Served","color":"#FF5AC4","is_top_group":false},"pulse":{"id":1585505097,"name":"Co Tina li"},"action_record_id":4340000934,"is_undo_action":false,"is_batch_action":false}',
    //               created_at: '16292437120165948',
    //             },
    //             {
    //               id: '5c68db4b-e687-469f-bd42-35a187260ed8',
    //               event: 'move_pulse_from_group',
    //               data: '{"board_id":1483255419,"group_id":"topics","source_board":{"id":1483255419,"name":"IC- Health, Life, Tax Dept","kind":"share"},"source_group":{"id":"topics","title":"Need to Call Back","color":"#CAB641","is_top_group":false},"dest_group":{"id":"new_group","title":"Served","color":"#FF5AC4","is_top_group":false},"pulse":{"id":1585505097,"name":"Co Tina li"},"action_record_id":4340000934,"is_undo_action":false,"is_batch_action":false}',
    //               created_at: '16292437120149822',
    //             },
    //             {
    //               id: 'c8fdef7f-6e02-42ce-878e-022a2d34133d',
    //               event: 'update_column_value',
    //               data: '{"board_id":1483255419,"group_id":"topics","is_top_group":false,"pulse_id":1585505097,"pulse_name":"Co Tina li","column_id":"status","column_type":"color","column_title":"Client Status","value":{"label":{"index":1,"text":"Served","style":{"color":"#FF5AC4","border":"#E04FAC","var_name":"light-pink"}},"post_id":null},"previous_value":{"label":{"index":0,"text":"Need to call back","style":{"color":"#CAB641","border":"#C0AB31","var_name":"mustered"}},"post_id":null},"is_column_with_hide_permissions":false}',
    //               created_at: '16292437096559002',
    //             },
    //             {
    //               id: '3cce0209-ae5d-4c79-95bf-638b870ed17f',
    //               event: 'move_pulse_into_group',
    //               data: '{"board_id":1483255419,"group_id":"new_group","source_board":{"id":1483255419,"name":"IC- Health, Life, Tax Dept","kind":"share"},"source_group":{"id":"topics","title":"Need to Call Back","color":"#CAB641","is_top_group":false},"dest_group":{"id":"new_group","title":"Served","color":"#FF5AC4","is_top_group":false},"pulse":{"id":1584833398,"name":"Ms. Loan Dinh"},"action_record_id":4339989537,"is_undo_action":false,"is_batch_action":false}',
    //               created_at: '16292435620714144',
    //             },
    //             {
    //               id: '9f3a6c2f-0f9f-41ae-a28b-975420214f2b',
    //               event: 'move_pulse_from_group',
    //               data: '{"board_id":1483255419,"group_id":"topics","source_board":{"id":1483255419,"name":"IC- Health, Life, Tax Dept","kind":"share"},"source_group":{"id":"topics","title":"Need to Call Back","color":"#CAB641","is_top_group":false},"dest_group":{"id":"new_group","title":"Served","color":"#FF5AC4","is_top_group":false},"pulse":{"id":1584833398,"name":"Ms. Loan Dinh"},"action_record_id":4339989537,"is_undo_action":false,"is_batch_action":false}',
    //               created_at: '16292435620701866',
    //             },
    //             {
    //               id: 'bed212f4-e5d0-4c30-b1b4-b4874f7ce17b',
    //               event: 'update_column_value',
    //               data: '{"board_id":1483255419,"group_id":"topics","is_top_group":false,"pulse_id":1584833398,"pulse_name":"Ms. Loan Dinh","column_id":"status","column_type":"color","column_title":"Client Status","value":{"label":{"index":1,"text":"Served","style":{"color":"#FF5AC4","border":"#E04FAC","var_name":"light-pink"}},"post_id":null},"previous_value":{"label":{"index":0,"text":"Need to call back","style":{"color":"#CAB641","border":"#C0AB31","var_name":"mustered"}},"post_id":1124220477},"is_column_with_hide_permissions":false}',
    //               created_at: '16292435606640338',
    //             },
    //             {
    //               id: '25c63e55-2b3b-44ba-ad59-5fce5d359181',
    //               event: 'update_column_value',
    //               data: '{"board_id":1483255419,"group_id":"topics","is_top_group":false,"pulse_id":1584833398,"pulse_name":"Ms. Loan Dinh","column_id":"people9","column_type":"multiple-person","column_title":"Worked By","value":{"personsAndTeams":[{"id":23501708,"kind":"person"}],"changed_at":"2021-08-17T23:36:30.356Z","column_settings":{"max_people_allowed":"1"}},"previous_value":{"column_settings":{"max_people_allowed":"1"}},"is_column_with_hide_permissions":false,"textual_value":"Jenny Pham"}',
    //               created_at: '16292433921048624',
    //             },
    //             {
    //               id: '643899d6-ee90-4d54-a98d-b55b171a3de7',
    //               event: 'subscribe',
    //               data: '{"item_id":1584833398,"item_name":"Ms. Loan Dinh","item_type":"Project","subscribed_id":23501708,"board_id":1483255419,"pulse_id":1584833398}',
    //               created_at: '16292433920728716',
    //             },
    //             {
    //               id: 'ff139dcf-804b-4389-a38d-f59446e8b94b',
    //               event: 'add_owner',
    //               data: '{"item_id":1585505097,"item_name":"Co Tina li","item_type":"Project","subscribed_id":23509606,"board_id":1483255419,"pulse_id":1585505097}',
    //               created_at: '16292430391925080',
    //             },
    //             {
    //               id: '163dfadc-c41a-44de-8aa0-77a2653a81b1',
    //               event: 'update_column_value',
    //               data: '{"board_id":1483255419,"group_id":"topics","is_top_group":false,"pulse_id":1585505097,"pulse_name":"Co Tina li","column_id":"people9","column_type":"multiple-person","column_title":"Worked By","value":{"personsAndTeams":[{"id":23509606,"kind":"person"}],"changed_at":"2021-08-17T22:26:17.741Z","column_settings":{"max_people_allowed":"1"}},"previous_value":{"column_settings":{"max_people_allowed":"1"}},"is_column_with_hide_permissions":false,"textual_value":"Arleen Quach"}',
    //               created_at: '16292430390388700',
    //             },
    //             {
    //               id: 'd5babd5d-0600-4fe5-ac6b-9e88863e3077',
    //               event: 'subscribe',
    //               data: '{"item_id":1585505097,"item_name":"Co Tina li","item_type":"Project","subscribed_id":23509606,"board_id":1483255419,"pulse_id":1585505097}',
    //               created_at: '16292430389864828',
    //             },
    //             {
    //               id: '4feded7a-a5e9-4f47-b8d2-4335f1be7ca8',
    //               event: 'update_column_value',
    //               data: '{"board_id":1483255419,"group_id":"topics","is_top_group":false,"pulse_id":1585505097,"pulse_name":"Co Tina li","column_id":"time_tracking","column_type":"duration","column_title":"Timer","value":{"running":"false","startDate":1629242548,"duration":81,"changed_at":"2021-08-17T23:23:49.411Z","column_settings":{"hide_footer":true}},"previous_value":{"running":"true","startDate":1629242548,"duration":0,"changed_at":"2021-08-17T23:22:28.785Z","column_settings":{"hide_footer":true}},"is_column_with_hide_permissions":false,"textual_value":"00:01:21","previous_textual_value":"00:01:21"}',
    //               created_at: '16292426296168588',
    //             },
    //             {
    //               id: 'cf2e43c0-ec57-4fa1-807b-772d6d925313',
    //               event: 'move_pulse_into_group',
    //               data: '{"board_id":1483255419,"group_id":"topics","source_board":{"id":1483255419,"name":"IC- Health, Life, Tax Dept","kind":"share"},"source_group":{"id":"group_title","title":"Client Waiting","color":"#e2445c","is_top_group":false},"dest_group":{"id":"topics","title":"Need to Call Back","color":"#CAB641","is_top_group":false},"pulse":{"id":1585505097,"name":"Co Tina li"},"action_record_id":4339907671,"is_undo_action":false,"is_batch_action":false}',
    //               created_at: '16292426287015188',
    //             },
    //             {
    //               id: '4518b8c4-6260-413f-a590-52d67b7edeb2',
    //               event: 'move_pulse_from_group',
    //               data: '{"board_id":1483255419,"group_id":"group_title","source_board":{"id":1483255419,"name":"IC- Health, Life, Tax Dept","kind":"share"},"source_group":{"id":"group_title","title":"Client Waiting","color":"#e2445c","is_top_group":false},"dest_group":{"id":"topics","title":"Need to Call Back","color":"#CAB641","is_top_group":false},"pulse":{"id":1585505097,"name":"Co Tina li"},"action_record_id":4339907671,"is_undo_action":false,"is_batch_action":false}',
    //               created_at: '16292426287004810',
    //             },
    //             {
    //               id: '45df59cb-5feb-444a-8d7a-b40256c3be7a',
    //               event: 'update_column_value',
    //               data: '{"board_id":1483255419,"group_id":"group_title","is_top_group":false,"pulse_id":1585505097,"pulse_name":"Co Tina li","column_id":"status","column_type":"color","column_title":"Client Status","value":{"label":{"index":0,"text":"Need to call back","style":{"color":"#CAB641","border":"#C0AB31","var_name":"mustered"}},"post_id":null},"previous_value":{"label":{"index":2,"text":"Client waiting","style":{"color":"#e2445c","border":"#CE3048","var_name":"red-shadow"}},"post_id":null},"is_column_with_hide_permissions":false}',
    //               created_at: '16292426274208338',
    //             },
    //             {
    //               id: '19946a32-91d3-42d0-afab-204a70dc156a',
    //               event: 'update_column_value',
    //               data: '{"board_id":1483255419,"group_id":"group_title","is_top_group":false,"pulse_id":1585505097,"pulse_name":"Co Tina li","column_id":"numbers","column_type":"numeric","column_title":"Line","value":{"value":4,"unit":null},"previous_value":null,"is_column_with_hide_permissions":false}',
    //               created_at: '16292426196112554',
    //             },
    //             {
    //               id: 'af83ef9c-5fcc-46c3-80b7-c0200a9c80d1',
    //               event: 'update_column_value',
    //               data: '{"board_id":1483255419,"group_id":"group_title","is_top_group":false,"pulse_id":1585505097,"pulse_name":"Co Tina li","column_id":"time_tracking","column_type":"duration","column_title":"Timer","value":{"running":"true","startDate":1629242548,"duration":0,"changed_at":"2021-08-17T23:22:28.785Z","column_settings":{"hide_footer":true}},"previous_value":{"column_settings":{"hide_footer":true}},"is_column_with_hide_permissions":false,"textual_value":"00:00:01"}',
    //               created_at: '16292425490418492',
    //             },
    //             {
    //               id: '968bf513-1711-4be6-ac15-2e046b29598e',
    //               event: 'update_column_value',
    //               data: '{"board_id":1483255419,"group_id":"group_title","is_top_group":false,"pulse_id":1585505097,"pulse_name":"Co Tina li","column_id":"status","column_type":"color","column_title":"Client Status","value":{"label":{"index":2,"text":"Client waiting","style":{"color":"#e2445c","border":"#CE3048","var_name":"red-shadow"}},"post_id":null},"previous_value":null,"is_column_with_hide_permissions":false}',
    //               created_at: '16292425471893336',
    //             },
    //             {
    //               id: 'dc7bc77a-f4ee-40ce-b70f-7d8304886c54',
    //               event: 'update_column_value',
    //               data: '{"board_id":1483255419,"group_id":"group_title","is_top_group":false,"pulse_id":1585505097,"pulse_name":"Co Tina li","column_id":"long_text3","column_type":"long-text","column_title":"Description","value":{"text":"Which hospital she can go BS MA?","changed_at":"2021-08-17T23:22:23.828Z","column_settings":{}},"previous_value":{"column_settings":{}},"is_column_with_hide_permissions":false,"textual_value":"Which hospital she can go BS MA?"}',
    //               created_at: '16292425451444022',
    //             },
    //             {
    //               id: 'b4a7791c-5f6b-484e-8e82-1d81147767ea',
    //               event: 'update_column_value',
    //               data: '{"board_id":1483255419,"group_id":"group_title","is_top_group":false,"pulse_id":1585505097,"pulse_name":"Co Tina li","column_id":"dropdown4","column_type":"dropdown","column_title":"Service(s)","value":{"chosenValues":[{"id":55,"name":"Medicare - Q&A"}]},"previous_value":null,"is_column_with_hide_permissions":false,"textual_value":"Medicare - Q&A"}',
    //               created_at: '16292425237849512',
    //             },
    //             {
    //               id: 'a55a7515-6b93-4a39-a651-e7fdb93e8f03',
    //               event: 'update_column_value',
    //               data: '{"board_id":1483255419,"group_id":"group_title","is_top_group":false,"pulse_id":1585505097,"pulse_name":"Co Tina li","column_id":"phone","column_type":"phone","column_title":"Phone","value":{"phone":"4085288215","column_settings":{"show_flag":false}},"previous_value":{"phone":"","column_settings":{"show_flag":false}},"is_column_with_hide_permissions":false,"textual_value":"4085288215"}',
    //               created_at: '16292425112577606',
    //             },
    //             {
    //               id: '2959f4d8-ed61-4561-85d8-32621d2b646f',
    //               event: 'create_pulse',
    //               data: '{"board_id":1483255419,"group_id":"group_title","group_name":"Client Waiting","group_color":"#e2445c","is_top_group":false,"pulse_id":1585505097,"pulse_name":"Co Tina li"}',
    //               created_at: '16292425047205948',
    //             },
    //             {
    //               id: '6dc8656e-f433-4b22-ba69-6573cf71ba32',
    //               event: 'move_pulse_into_group',
    //               data: '{"board_id":1483255419,"group_id":"new_group","source_board":{"id":1483255419,"name":"IC- Health, Life, Tax Dept","kind":"share"},"source_group":{"id":"topics","title":"Need to Call Back","color":"#CAB641","is_top_group":false},"dest_group":{"id":"new_group","title":"Served","color":"#FF5AC4","is_top_group":false},"pulse":{"id":1585265573,"name":"chu Tung Cai"},"action_record_id":4339861581,"is_undo_action":false,"is_batch_action":false}',
    //               created_at: '16292420971549514',
    //             },
    //             {
    //               id: 'c66f5c82-5cb5-42c9-9177-168207f2f61c',
    //               event: 'move_pulse_from_group',
    //               data: '{"board_id":1483255419,"group_id":"topics","source_board":{"id":1483255419,"name":"IC- Health, Life, Tax Dept","kind":"share"},"source_group":{"id":"topics","title":"Need to Call Back","color":"#CAB641","is_top_group":false},"dest_group":{"id":"new_group","title":"Served","color":"#FF5AC4","is_top_group":false},"pulse":{"id":1585265573,"name":"chu Tung Cai"},"action_record_id":4339861581,"is_undo_action":false,"is_batch_action":false}',
    //               created_at: '16292420971535918',
    //             },
    //             {
    //               id: '34b3ee67-c6ad-4881-bd2f-e788a6b4aba8',
    //               event: 'update_column_value',
    //               data: '{"board_id":1483255419,"group_id":"topics","is_top_group":false,"pulse_id":1585265573,"pulse_name":"chu Tung Cai","column_id":"status","column_type":"color","column_title":"Client Status","value":{"label":{"index":1,"text":"Served","style":{"color":"#FF5AC4","border":"#E04FAC","var_name":"light-pink"}},"post_id":null},"previous_value":{"label":{"index":0,"text":"Need to call back","style":{"color":"#CAB641","border":"#C0AB31","var_name":"mustered"}},"post_id":null},"is_column_with_hide_permissions":false}',
    //               created_at: '16292420955962150',
    //             },
    //           ],
    //         },
    //       ],
    //     },
    //     account_id: 9336539,
    //   };
    //   const b = test.data.boards[0].activity_logs
    //     .filter((log) => log.event === 'update_column_value')
    //     .map((log) => {
    //       let data = JSON.parse(log.data);
    //       data = {
    //         ...data,
    //         created_at: moment(new Date(parseInt(log.created_at) / 1e4))
    //           .tz('America/Los_Angeles')
    //           .format('YYYY-MM-DD hh:mm:ss A'),
    //       };
    //       return data;
    //     });
    //   console.log(b);
    // }, 2000);
    //#endregion
  }

  @Get('/download')
  async downloadArchiverReport(
    @Query() queries,
    @Res() res: Response,
  ){
    const downloadUrl = await this.mondayService._autoImportIC(queries);
    res.download(downloadUrl);
  }

  @Get('/test')
  async test(){
    return this.mondayService._autoImportIC('Alo');
  }

  @Get('/healthy')
  healthy() {
    return 'Ok!';
  }
}
