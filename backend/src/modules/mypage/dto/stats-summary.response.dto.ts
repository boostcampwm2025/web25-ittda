import { Expose } from 'class-transformer';

export class StatsSummaryResponseDto {
  @Expose()
  count: number;
}
