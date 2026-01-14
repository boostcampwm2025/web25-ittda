import { PostContributorRole } from '@/enums/post-contributor-role.enum';
import { PostScope } from '@/enums/post-scope.enum';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { PostBlockDto } from './post-block.dto';

export class PostContributorUserDto {
  @ApiProperty()
  nickname: string;
}

export class PostContributorDto {
  @ApiProperty()
  userId: string;
  @ApiProperty({ enum: PostContributorRole })
  role: PostContributorRole;
  @ApiPropertyOptional()
  nickname?: string;
}

export class PostDetailDto {
  @ApiProperty()
  id: string;
  @ApiProperty({ enum: PostScope })
  scope: PostScope;
  @ApiProperty()
  ownerUserId: string;
  @ApiPropertyOptional()
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
}
