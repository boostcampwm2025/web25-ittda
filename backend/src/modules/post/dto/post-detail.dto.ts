import { PostContributorRole } from '@/enums/post-contributor-role.enum';
import { PostScope } from '@/enums/post-scope.enum';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { PostBlockDto } from './post-block.dto';
import { IsUUID } from 'class-validator';

export class PostContributorUserDto {
  @ApiProperty()
  nickname: string;
}

export class PostContributorDto {
  @ApiProperty({ format: 'uuid' })
  userId: string;
  @ApiProperty({ enum: PostContributorRole })
  role: PostContributorRole;
  @ApiPropertyOptional()
  nickname?: string;
  @ApiPropertyOptional()
  groupNickname?: string | null;
  @ApiPropertyOptional({ format: 'uuid' })
  profileImageId?: string | null;
  @ApiPropertyOptional({ format: 'uuid' })
  groupProfileImageId?: string | null;
}

export class PostDetailDto {
  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  id: string;
  @ApiProperty({ enum: PostScope })
  scope: PostScope;
  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  ownerUserId: string;
  @ApiPropertyOptional({ format: 'uuid' })
  @IsUUID()
  groupId?: string | null;
  @ApiProperty()
  title: string;
  @ApiProperty()
  createdAt: Date;
  @ApiProperty()
  updatedAt: Date;
  @ApiProperty({ type: () => [PostBlockDto] })
  blocks: PostBlockDto[];
  @ApiProperty({ type: () => [PostContributorDto] })
  contributors: PostContributorDto[];
  @ApiProperty({
    description: '요청자 기준 권한 정보',
    example: 'EDITOR',
  })
  permission: 'ADMIN' | 'EDITOR' | 'VIEWER' | 'OWNER' | null;
  @ApiPropertyOptional({
    description: '해당 게시글의 공동 수정 드래프트가 열려있는지 여부',
  })
  hasActiveEditDraft?: boolean;

  @ApiPropertyOptional({
    description: '공유 토큰 (공유 링크 활성화된 경우)',
    format: 'uuid',
  })
  shareToken?: string | null;

  @ApiPropertyOptional({
    description: '개인 글이 하나 이상의 그룹에 공유되어 있는지 여부',
  })
  isSharedPost?: boolean;

  @ApiPropertyOptional({
    description:
      '공유된 그룹 목록 (원작성자가 조회할 때만 채워짐, 비소유자에게는 노출하지 않음)',
    type: 'array',
    items: {
      type: 'object',
      properties: {
        groupId: { type: 'string', format: 'uuid' },
        groupName: { type: 'string' },
      },
    },
  })
  sharedGroups?: { groupId: string; groupName: string }[];
}
