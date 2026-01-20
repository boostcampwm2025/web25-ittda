import { Expose } from 'class-transformer';

export class MonthRecordResponseDto {
  @Expose()
  month: string; // "YYYY-MM"

  @Expose()
  count: number;

  @Expose()
  coverUrl: string | null; // TODO: coverUrl 명세 수정

  @Expose()
  latestTitle: string;

  @Expose()
  latestLocation: string | null;
}
