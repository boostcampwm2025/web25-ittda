// src/modules/feed/dto/get-past-feed.query.dto.ts
import { ApiProperty } from '@nestjs/swagger';
import { IsInt, IsOptional, IsString, Max, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class GetPastFeedQueryDto {
  @ApiProperty({
    description:
      '지난 기록 무한스크롤용 커서 (마지막 항목의 eventAt ISO 문자열과 id를 담은 JSON을 Base64로 인코딩한 값)',
    required: false,
    example:
      'eyJldmVudEF0IjoiMjAyNi0wMS0yOFQxODo1OTozNC4wMDBaIiwiaWQiOiJiNmUyYTZkMC02ZTFhLTRhM2YtOWIyYS05YjZjOWY4ZTNhMTEifQ==',
  })
  @IsString()
  @IsOptional()
  cursor?: string;

  @ApiProperty({
    description: '한 번에 조회할 개수',
    required: false,
    default: 10,
  })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(30)
  @IsOptional()
  limit?: number = 10;
}
