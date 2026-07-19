import { IsIn } from 'class-validator';

export class RemoveFcmTokenDto {
  @IsIn(['web', 'android'])
  platform!: 'web' | 'android';
}
