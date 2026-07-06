import { IsIn, IsString } from 'class-validator';

export class RegisterFcmTokenDto {
  @IsString()
  token!: string;

  @IsIn(['web', 'android'])
  platform!: 'web' | 'android';
}
