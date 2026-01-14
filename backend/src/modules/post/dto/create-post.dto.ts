import {
  IsEnum,
  IsOptional,
  IsString,
  MaxLength,
  ValidateNested,
  IsUUID,
  IsArray,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { PostScope } from '@/enums/post-scope.enum';
import { PostBlockDto } from './post-block.dto';

export class CreatePostDto {
  @ApiProperty({ enum: PostScope })
  @IsEnum(PostScope)
  scope: PostScope;

  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID()
  groupId?: string;

  @ApiProperty()
  @IsString()
  @MaxLength(200)
  title: string;

  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID()
  thumbnailMediaId?: string;

  @ApiProperty({ type: () => [PostBlockDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PostBlockDto)
  blocks: PostBlockDto[];
}
