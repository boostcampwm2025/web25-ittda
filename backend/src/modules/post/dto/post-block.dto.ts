import {
  ApiExtraModels,
  ApiProperty,
  ApiPropertyOptional,
  getSchemaPath,
} from '@nestjs/swagger';
import {
  IsEnum,
  IsObject,
  IsOptional,
  IsUUID,
  Validate,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { PostBlockType } from '@/enums/post-block-type.enum';
import { BlockValueMap } from '@/modules/post/types/post-block.types';
import { BlockLayoutDto } from './block-layout.dto';
import { PostMood } from '@/enums/post-mood.enum';
import {
  LocationValueConstraint,
  MediaValueConstraint,
  MoodValueConstraint,
  RatingValueConstraint,
} from '../validator/post-block.validators';

export class MoodValueDto {
  @ApiProperty({ enum: Object.values(PostMood) })
  mood: PostMood;
}

export class LocationValueDto {
  @ApiProperty()
  lat: number;

  @ApiProperty()
  lng: number;

  @ApiProperty()
  address: string;

  @ApiPropertyOptional()
  placeName?: string;
}

export class RatingValueDto {
  @ApiProperty({ description: 'Allows one decimal place.' })
  rating: number;
}

export class MediaValueDto {
  @ApiProperty()
  title: string;

  @ApiProperty()
  type: string;

  @ApiProperty()
  externalId: string;

  @ApiPropertyOptional()
  year?: string;

  @ApiPropertyOptional()
  imageUrl?: string;

  @ApiPropertyOptional({ nullable: true })
  originalTitle?: string | null;
}

@ApiExtraModels(MoodValueDto, LocationValueDto, RatingValueDto, MediaValueDto)
export class PostBlockDto {
  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID()
  id?: string;

  @ApiProperty({ enum: PostBlockType })
  @IsEnum(PostBlockType)
  type: PostBlockType;

  @IsObject()
  @Validate(MoodValueConstraint)
  @Validate(LocationValueConstraint)
  @Validate(RatingValueConstraint)
  @Validate(MediaValueConstraint)
  @ApiProperty({
    description:
      'Block value. When type=MOOD, LOCATION, RATING, or MEDIA, value shape is enforced.',
    oneOf: [
      { type: 'object', additionalProperties: true },
      { $ref: getSchemaPath(MoodValueDto) },
      { $ref: getSchemaPath(LocationValueDto) },
      { $ref: getSchemaPath(RatingValueDto) },
      { $ref: getSchemaPath(MediaValueDto) },
    ],
  })
  value: BlockValueMap[PostBlockType];

  @ApiProperty({ type: () => BlockLayoutDto })
  @ValidateNested()
  @Type(() => BlockLayoutDto)
  layout: BlockLayoutDto;
}
