import { IsOptional, IsString, IsObject, IsUUID } from 'class-validator';

export class UpdateUserDto {
  @IsOptional()
  @IsString()
  nickname?: string;

  @IsOptional()
  @IsUUID()
  profileImageId?: string;
}

export class UpdateSettingsDto {
  @IsObject()
  settings: Record<string, any>;
}
