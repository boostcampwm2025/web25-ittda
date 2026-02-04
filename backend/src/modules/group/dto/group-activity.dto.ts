import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { GroupActivityType } from '@/enums/group-activity-type.enum';

export class GroupActivityActorDto {
  @ApiPropertyOptional({ format: 'uuid', nullable: true })
  userId?: string | null;

  @ApiPropertyOptional()
  nickname?: string | null;

  @ApiPropertyOptional()
  groupNickname?: string | null;

  @ApiPropertyOptional({ format: 'uuid' })
  profileImageId?: string | null;
}

export class GroupActivityItemDto {
  @ApiProperty({ format: 'uuid' })
  id: string;

  @ApiProperty({ enum: GroupActivityType })
  type: GroupActivityType;

  @ApiPropertyOptional({ format: 'uuid' })
  refId?: string | null;

  @ApiPropertyOptional({ type: Object })
  meta?: Record<string, unknown> | null;

  @ApiProperty({ type: Date })
  createdAt: Date;

  @ApiProperty({ type: () => [GroupActivityActorDto] })
  actors: GroupActivityActorDto[];
}

export class PaginatedGroupActivityResponseDto {
  @ApiProperty({ type: () => [GroupActivityItemDto] })
  items: GroupActivityItemDto[];

  @ApiPropertyOptional()
  nextCursor?: string;
}
