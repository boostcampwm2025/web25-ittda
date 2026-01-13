import { PostContributorRole } from '@/enums/post-contributor-role.enum';
import { PostScope } from '@/enums/post-scope.enum';
import { PostBlockType } from '@/enums/post-block-type.enum';
import { BlockValueMap } from '@/modules/post/types/post-block.types';

export class PostContributorUserDto {
  id: string;
  nickname: string;
}

export class PostContributorDto {
  userId: string;
  role: PostContributorRole;
  user?: PostContributorUserDto;
}

export class PostBlockLayoutDto {
  row: number;
  col: number;
  span: number;
}

export class PostBlockDto {
  type: PostBlockType;
  value: BlockValueMap[PostBlockType];
  layout: PostBlockLayoutDto;
}

export class PostDetailDto {
  id: string;
  scope: PostScope;
  ownerUserId: string;
  groupId?: string | null;
  title: string;
  createdAt: Date;
  updatedAt: Date;
  blocks: PostBlockDto[];
  contributors: PostContributorDto[];
}
