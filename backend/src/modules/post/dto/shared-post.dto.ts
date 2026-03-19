import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { PostBlockDto } from './post-block.dto';

export class SharedPostResponseDto {
  @ApiProperty({ format: 'uuid' })
  id: string;

  @ApiProperty()
  title: string;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;

  @ApiProperty({ type: () => [PostBlockDto] })
  blocks: PostBlockDto[];

  @ApiPropertyOptional({
    description: '미디어 ID → presigned URL 매핑 (공유 페이지 이미지 표시용)',
    type: 'object',
    additionalProperties: { type: 'string' },
  })
  resolvedMediaUrls: Record<string, string>;
}

export class ShareTokenResponseDto {
  @ApiProperty({ format: 'uuid' })
  shareToken: string;

  @ApiProperty()
  shareUrl: string;
}
