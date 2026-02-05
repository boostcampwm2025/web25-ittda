import { IsOptional, IsString, IsObject, IsUUID } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateMeDto {
  @ApiProperty({
    description: '닉네임 (2~50자)',
    example: '길동이',
    required: false,
  })
  @IsOptional()
  @IsString()
  nickname?: string;

  @ApiProperty({
    description: '프로필 이미지 URL (deprecated, imageId 권장)',
    required: false,
  })
  @IsOptional()
  @IsUUID()
  profileImageId?: string;
}

export class UpdateSettingsDto {
  @ApiProperty({
    description: '설정 정보 JSON 객체',
    example: { theme: 'dark' },
  })
  @IsObject()
  settings: Record<string, any>;
}
