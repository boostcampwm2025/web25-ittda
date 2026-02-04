import { ApiProperty } from '@nestjs/swagger';

export class GuestResponseDto {
  @ApiProperty({ description: '게스트 유저인지 여부', example: true })
  guest: boolean;

  @ApiProperty({ description: '게스트 세션 ID' })
  guestSessionId: string;

  @ApiProperty({ description: '세션 만료 일시' })
  expiresAt: Date;
}
