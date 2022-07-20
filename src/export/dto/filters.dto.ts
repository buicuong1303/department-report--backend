import { ReportTypes } from '../enum/report-type';
export class FiltersDto {
  agents: any[];
  department: any;
  fromDate: any;
  toDate: any;
  onDate: any;
  typeReport: ReportTypes
}
