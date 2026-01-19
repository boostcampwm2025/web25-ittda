import { IsOptional, IsString, IsObject } from 'class-validator';

export class UpdateMeDto {
  @IsOptional()
  @IsString()
  nickname?: string;

  @IsOptional()
  @IsString()
  profileImageUrl?: string;
}

export class UpdateSettingsDto {
  @IsObject()
  settings: Record<string, any>;
}
