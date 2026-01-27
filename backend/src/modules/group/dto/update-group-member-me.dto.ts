import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString, IsUUID, Length, Matches } from 'class-validator';

export class UpdateGroupMemberMeDto {
  @ApiProperty({
    description: '그룹 내 닉네임',
    example: '멋진별명',
    required: false,
  })
  @IsOptional()
  @IsString()
  @Length(2, 50, { message: 'USER_NAME_INVALID' })
  @Matches(/^[a-zA-Z0-9가-힣 ]+$/, { message: 'USER_NAME_INVALID' })
  nicknameInGroup?: string;

  @ApiProperty({
    description: '프로필 이미지 Asset ID',
    example: 'uuid',
    required: false,
  })
  @IsOptional()
  @IsUUID('4')
  profileMediaId?: string;
}
