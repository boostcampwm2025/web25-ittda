import { Expose } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

export class GetMonthImagesResponseDto {
  @ApiProperty({
    description: '이미지 Asset ID 목록',
    example: ['asset-id-1', 'asset-id-2'],
  })
  @Expose()
  images: string[];
}
