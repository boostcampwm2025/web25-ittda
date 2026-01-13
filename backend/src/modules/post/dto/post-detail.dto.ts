import { PostContributorRole } from '@/enums/post-contributor-role.enum';
import { PostScope } from '@/enums/post-scope.enum';
import { PostBlockType } from '@/enums/post-block-type.enum';
import { BlockValueMap } from '@/modules/post/types/post-block.types';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

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

export class PostBlockLayoutDto {
  @ApiProperty()
  row: number;
  @ApiProperty()
  col: number;
  @ApiProperty()
  span: number;
}

export class PostBlockDto {
  @ApiProperty({ enum: PostBlockType })
  type: PostBlockType;
  @ApiProperty()
  value: BlockValueMap[PostBlockType];
  @ApiProperty({ type: () => PostBlockLayoutDto })
  layout: PostBlockLayoutDto;
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
