import { ApiProperty } from '@nestjs/swagger';
import { IsUUID } from 'class-validator';

export class RestoreGuestRequestDto {
  @ApiProperty({ description: '재활용할 게스트 세션 ID' })
  @IsUUID()
  sessionId: string;
}
