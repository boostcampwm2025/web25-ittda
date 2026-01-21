import { IsString, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateMonthCoverBodyDto {
  @ApiProperty({
    description: '변경할 커버 이미지 URL',
    example: 'https://example.com/image.jpg',
  })
  @IsString()
  @IsNotEmpty()
  @IsString()
  @IsNotEmpty()
  coverAssetId: string;
}
