import { ApiProperty } from '@nestjs/swagger';
import { GroupCoverDto } from './get-groups.dto';

export class UpdateGroupCoverDto {
  @ApiProperty({ description: '커버로 사용할 Asset ID' })
  assetId: string;

  @ApiProperty({ description: '해당 Asset이 포함된 게시글 ID' })
  sourcePostId: string;
}

export class UpdateGroupCoverResponseDto {
  @ApiProperty({ description: '그룹 ID' })
  groupId: string;

  @ApiProperty({ description: '업데이트된 커버 정보' })
  cover: GroupCoverDto;

  @ApiProperty({ description: '업데이트 일시' })
  updatedAt: Date;
}
