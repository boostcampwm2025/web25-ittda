import { IsOptional, IsString, IsObject, IsUUID } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateMeDto {
  @ApiProperty({
    description: '닉네임 (2~50자)',
    example: '길동이',
    required: false,
  })
  @IsOptional()
  @IsString()
  nickname?: string;

  @ApiPropertyOptional({
    description: '프로필 이미지 URL (deprecated, imageId 권장)',
    required: false,
    nullable: true,
  })
  @IsOptional()
  @IsUUID()
  profileImageId?: string | null;
}

export class UpdateSettingsDto {
  @ApiProperty({
    description: '설정 정보 JSON 객체',
    example: { theme: 'dark' },
  })
  @IsObject()
  settings: Record<string, any>;
}
