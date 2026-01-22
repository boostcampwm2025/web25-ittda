import { IsString, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateMonthCoverBodyDto {
  @ApiProperty({
    description: '변경할 커버 이미지 Asset ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsString()
  @IsNotEmpty()
  coverAssetId: string;
}
