import { ApiProperty } from '@nestjs/swagger';
import { PostScope } from '@/enums/post-scope.enum';

export class TrashPostResponseDto {
  @ApiProperty({ description: '게시글 ID' })
  id: string;

  @ApiProperty({ description: '제목' })
  title: string;

  @ApiProperty({ enum: PostScope, description: '공개 범위' })
  scope: PostScope;

  @ApiProperty({ description: '삭제된 일시' })
  deletedAt: Date;

  @ApiProperty({ description: '그룹 ID', nullable: true })
  groupId: string | null;
}
