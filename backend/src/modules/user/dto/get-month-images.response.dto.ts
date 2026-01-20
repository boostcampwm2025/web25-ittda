import { Expose } from 'class-transformer';

export class GetMonthImagesResponseDto {
  @Expose()
  images: string[];
}
