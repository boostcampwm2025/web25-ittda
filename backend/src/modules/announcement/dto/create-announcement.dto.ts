import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsBoolean,
  IsDateString,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';

export class CreateAnnouncementDto {
  @ApiProperty({ description: '공지 제목', maxLength: 200 })
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  title: string;

  @ApiPropertyOptional({ description: '공지 내용 (텍스트)' })
  @IsOptional()
  @IsString()
  content?: string;

  @ApiPropertyOptional({ description: '이미지 URL' })
  @IsOptional()
  @IsString()
  imageUrl?: string;

  @ApiPropertyOptional({ description: '활성화 여부', default: false })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @ApiPropertyOptional({ description: '게시 시작 시각 (ISO 8601)' })
  @IsOptional()
  @IsDateString()
  startAt?: string;

  @ApiPropertyOptional({ description: '게시 종료 시각 (ISO 8601)' })
  @IsOptional()
  @IsDateString()
  endAt?: string;
}
