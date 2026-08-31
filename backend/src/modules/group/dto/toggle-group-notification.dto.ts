import { IsBoolean } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ToggleGroupNotificationDto {
  @ApiProperty({
    description: '그룹 알림 음소거 여부',
    example: true,
  })
  @IsBoolean()
  muted!: boolean;
}
