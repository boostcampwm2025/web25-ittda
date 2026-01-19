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
  ValidationArguments,
  ValidatorConstraint,
  ValidatorConstraintInterface,
} from 'class-validator';
import { Type } from 'class-transformer';
import { PostBlockType } from '@/enums/post-block-type.enum';
import { BlockValueMap } from '@/modules/post/types/post-block.types';
import { BlockLayoutDto } from './block-layout.dto';
import { PostMood } from '@/enums/post-mood.enum';

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

@ValidatorConstraint({ name: 'MoodValueConstraint', async: false })
class MoodValueConstraint implements ValidatorConstraintInterface {
  validate(value: unknown, args?: ValidationArguments): boolean {
    const target = args?.object as PostBlockDto | undefined;
    if (!target || target.type !== PostBlockType.MOOD) return true;
    if (!value || typeof value !== 'object') return false;
    const mood = (value as { mood?: unknown }).mood;
    return (
      typeof mood === 'string' &&
      (Object.values(PostMood) as string[]).includes(mood)
    );
  }

  defaultMessage(): string {
    return `mood must be one of: ${Object.values(PostMood).join(', ')}`;
  }
}

@ValidatorConstraint({ name: 'LocationValueConstraint', async: false })
class LocationValueConstraint implements ValidatorConstraintInterface {
  validate(value: unknown, args?: ValidationArguments): boolean {
    const target = args?.object as PostBlockDto | undefined;
    if (!target || target.type !== PostBlockType.LOCATION) return true;
    if (!value || typeof value !== 'object') return false;
    const candidate = value as {
      lat?: unknown;
      lng?: unknown;
      address?: unknown;
      placeName?: unknown;
    };
    const hasLat =
      typeof candidate.lat === 'number' && Number.isFinite(candidate.lat);
    const hasLng =
      typeof candidate.lng === 'number' && Number.isFinite(candidate.lng);
    const hasAddress = typeof candidate.address === 'string';
    const hasValidPlaceName =
      candidate.placeName === undefined ||
      typeof candidate.placeName === 'string';
    return hasLat && hasLng && hasAddress && hasValidPlaceName;
  }

  defaultMessage(): string {
    return 'location must include lat, lng, address with valid types';
  }
}

@ValidatorConstraint({ name: 'RatingValueConstraint', async: false })
class RatingValueConstraint implements ValidatorConstraintInterface {
  validate(value: unknown, args?: ValidationArguments): boolean {
    const target = args?.object as PostBlockDto | undefined;
    if (!target || target.type !== PostBlockType.RATING) return true;
    if (typeof value !== 'object' || value === null) return false;
    const rating = (value as { rating?: unknown }).rating;
    if (typeof rating !== 'number' || !Number.isFinite(rating)) return false;
    return Math.round(rating * 10) === rating * 10;
  }

  defaultMessage(): string {
    return 'rating must be a number with at most one decimal place';
  }
}

@ApiExtraModels(MoodValueDto, LocationValueDto, RatingValueDto)
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
  @ApiProperty({
    description:
      'Block value. When type=MOOD, LOCATION, or RATING, value shape is enforced.',
    oneOf: [
      { type: 'object', additionalProperties: true },
      { $ref: getSchemaPath(MoodValueDto) },
      { $ref: getSchemaPath(LocationValueDto) },
      { $ref: getSchemaPath(RatingValueDto) },
    ],
  })
  value: BlockValueMap[PostBlockType];

  @ApiProperty({ type: () => BlockLayoutDto })
  @ValidateNested()
  @Type(() => BlockLayoutDto)
  layout: BlockLayoutDto;
}
