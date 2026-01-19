import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsIn, IsOptional, IsString, MaxLength } from 'class-validator';

export class DevTokenRequestDto {
  @ApiPropertyOptional({ example: 'kakao' })
  @IsOptional()
  @IsString()
  @IsIn(['google', 'kakao'])
  provider?: 'google' | 'kakao';

  @ApiPropertyOptional({ example: 'dev-user-001' })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  providerId?: string;

  @ApiPropertyOptional({ example: 'dev-user' })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  nickname?: string;

  @ApiPropertyOptional({ example: 'dev@example.com' })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  email?: string;
}
