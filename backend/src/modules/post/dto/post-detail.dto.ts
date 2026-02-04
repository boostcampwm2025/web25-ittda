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
}
