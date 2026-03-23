import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';

export class CreateInquiryDto {
  @ApiProperty({
    description: '문의 유형 (버그 신고, 기능 제안, 계정/로그인 문제, 기타:...)',
    maxLength: 100,
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  category: string;

  @ApiProperty({ description: '문의 내용' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(2000)
  content: string;

  @ApiPropertyOptional({ description: '답변 받을 이메일 (선택)' })
  @IsOptional()
  @IsEmail()
  email?: string;
}
