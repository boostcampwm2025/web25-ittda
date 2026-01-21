import { Expose } from 'class-transformer';

export class EmotionSummaryResponseDto {
  @Expose()
  emotion: string;

  @Expose()
  count: number;
}
