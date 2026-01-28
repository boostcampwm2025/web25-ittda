import { IsString, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateGroupMonthCoverDto {
  @ApiProperty({
    description: '변경할 커버 이미지 Asset ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsString()
  @IsNotEmpty()
  assetId: string;

  @ApiProperty({
    description: '해당 Asset이 포함된 게시글 ID',
    example: '123e4567-e89b-12d3-a456-426614174001',
  })
  @IsString()
  @IsNotEmpty()
  sourcePostId: string;
}
