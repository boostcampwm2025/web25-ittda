import { Expose } from 'class-transformer';

export class DayRecordResponseDto {
  @Expose()
  date: string; // "YYYY-MM-DD"

  @Expose()
  postCount: number;

  @Expose()
  coverAssetId: string | null;

  @Expose()
  latestPostTitle: string;

  @Expose()
  latestPlaceName: string | null;
}
