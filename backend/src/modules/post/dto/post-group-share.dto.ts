import { ApiProperty } from '@nestjs/swagger';
import { ArrayNotEmpty, IsArray, IsUUID } from 'class-validator';

export class ShareToGroupsDto {
  @ApiProperty({
    type: [String],
    format: 'uuid',
    description: '공유할 그룹 ID 목록',
  })
  @IsArray()
  @ArrayNotEmpty()
  @IsUUID('4', { each: true })
  groupIds: string[];
}

export class PostGroupShareDto {
  @ApiProperty({ format: 'uuid' })
  groupId: string;

  @ApiProperty()
  groupName: string;

  @ApiProperty()
  sharedAt: Date;
}
