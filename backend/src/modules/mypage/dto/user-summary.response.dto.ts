import { ApiProperty } from '@nestjs/swagger';
import { Expose, Type } from 'class-transformer';

export class LocationStatDto {
  @ApiProperty({ description: '장소명', example: '관악산' })
  @Expose()
  placeName: string;

  @ApiProperty({ description: '방문 횟수', example: 3 })
  @Expose()
  count: number;
}

export class MonthlyCountDto {
  @ApiProperty({ description: '월 (YYYY-MM)', example: '2026-01' })
  @Expose()
  month: string;

  @ApiProperty({ description: '해당 월 기록 수', example: 11 })
  @Expose()
  count: number;
}

export class UserStatsDto {
  @ApiProperty({
    description: '최근 사용한 태그 명단',
    example: ['공부', '운동'],
  })
  @Expose()
  recentTags: string[];

  @ApiProperty({
    description: '자주 사용한 태그 명단',
    example: ['술', '작업'],
  })
  @Expose()
  frequentTags: string[];

  @ApiProperty({
    description: '최근 느낀 감정 명단',
    example: ['행복', '슬픔'],
  })
  @Expose()
  recentEmotions: string[];

  @ApiProperty({
    description: '자주 느낀 감정 명단',
    example: ['행복', '피곤'],
  })
  @Expose()
  frequentEmotions: string[];

  @ApiProperty({ description: '총 기록(게시글) 수', example: 150 })
  @Expose()
  totalPosts: number;

  @ApiProperty({ description: '총 이미지 수', example: 420 })
  @Expose()
  totalImages: number;

  @ApiProperty({
    description: '자주 방문한 장소 TOP 5',
    type: [LocationStatDto],
  })
  @Expose()
  @Type(() => LocationStatDto)
  frequentLocations: LocationStatDto[];

  @ApiProperty({
    description: '최근 12개월 기록 수',
    type: [MonthlyCountDto],
  })
  @Expose()
  @Type(() => MonthlyCountDto)
  monthlyCounts: MonthlyCountDto[];
}

export class UserSummaryResponse {
  @ApiProperty({
    description: '유저 ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @Expose()
  id: string;
  @ApiProperty({
    description: '이메일',
    example: 'user@example.com',
    nullable: true,
  })
  @Expose()
  email: string;
  @ApiProperty({ description: '닉네임', example: '홍길동' })
  @Expose()
  nickname: string;
  @ApiProperty({
    description: '프로필 이미지 ID',
    example: '888e4567-e89b-12d3-a456-426614174000',
    nullable: true,
  })
  @Expose()
  profileImageId?: string | null;
  @ApiProperty({ description: '설정 정보', example: { theme: 'dark' } })
  @Expose()
  settings: Record<string, any>;
}
export class UserSummaryResponseDto {
  userId: string;
  user: UserSummaryResponse;
  @ApiProperty({ description: '유저 통계 정보', type: UserStatsDto })
  @Expose()
  @Type(() => UserStatsDto)
  stats: UserStatsDto;
}
