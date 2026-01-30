import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  IsArray,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { TemplateScope } from '@/enums/template-scope.enum';
import { PostBlockType } from '@/enums/post-block-type.enum';

export class TemplateBlockLayoutDto {
  @ApiProperty({ description: '시작 행 (1부터 시작)', example: 1 })
  row: number;

  @ApiProperty({ description: '시작 열 (1부터 시작)', example: 1 })
  col: number;

  @ApiProperty({ description: '가로 너비 (칸 수)', example: 2 })
  span: number;
}

export class TemplateBlockDto {
  @ApiProperty({
    enum: PostBlockType,
    description: '블록 타입',
    example: 'DATE',
  })
  @IsEnum(PostBlockType)
  type: PostBlockType;

  @ApiProperty({ type: TemplateBlockLayoutDto, description: '레이아웃 정보' })
  @ValidateNested()
  @Type(() => TemplateBlockLayoutDto)
  layout: TemplateBlockLayoutDto;
}

export class CreateTemplateDto {
  @ApiProperty({ description: '템플릿 제목', example: '기본 일상' })
  @IsString()
  @IsNotEmpty()
  title: string;

  @ApiPropertyOptional({
    description: '템플릿 설명',
    example: '가장 표준적인 기록 구성',
  })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({
    enum: TemplateScope,
    description: '템플릿 범위',
    example: 'ME',
  })
  @IsEnum(TemplateScope)
  scope: TemplateScope;

  @ApiPropertyOptional({
    description: '그룹 ID (scope이 GROUP인 경우 필수)',
    example: 'uuid',
  })
  @IsUUID()
  @IsOptional()
  groupId?: string;

  @ApiProperty({ type: [TemplateBlockDto], description: '구성 블록 목록' })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => TemplateBlockDto)
  blocks: TemplateBlockDto[];
}

export class UpdateTemplateDto {
  @ApiPropertyOptional({ description: '템플릿 제목', example: '수정된 템플릿' })
  @IsString()
  @IsOptional()
  title?: string;

  @ApiPropertyOptional({ description: '템플릿 설명', example: '수정된 설명' })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiPropertyOptional({
    type: [TemplateBlockDto],
    description: '구성 블록 목록',
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => TemplateBlockDto)
  blocks?: TemplateBlockDto[];
}

export class GetTemplatesQueryDto {
  @ApiProperty({
    enum: TemplateScope,
    description: '조회할 범위',
    example: 'SYSTEM',
  })
  @IsEnum(TemplateScope)
  scope: TemplateScope;

  @ApiPropertyOptional({
    description: '그룹 ID (scope이 GROUP인 경우 필수)',
    example: 'uuid',
  })
  @IsUUID()
  @IsOptional()
  groupId?: string;
}

export class TemplateResponseDto {
  @ApiProperty({ description: '템플릿 ID', example: 'uuid' })
  id: string;

  @ApiProperty({ description: '템플릿 제목', example: '기본 일상' })
  title: string;

  @ApiPropertyOptional({
    description: '템플릿 설명',
    example: '가장 표준적인 기록 구성',
  })
  description?: string;

  @ApiProperty({
    enum: TemplateScope,
    description: '템플릿 범위',
    example: 'ME',
  })
  scope: TemplateScope;

  @ApiPropertyOptional({ description: '소유자 ID', example: 'uuid' })
  ownerUserId?: string;

  @ApiPropertyOptional({ description: '그룹 ID', example: 'uuid' })
  groupId?: string;

  @ApiProperty({ type: [TemplateBlockDto], description: '구성 블록 목록' })
  blocks: TemplateBlockDto[];

  @ApiProperty({ description: '생성일' })
  createdAt: Date;

  @ApiProperty({ description: '수정일' })
  updatedAt: Date;
}
