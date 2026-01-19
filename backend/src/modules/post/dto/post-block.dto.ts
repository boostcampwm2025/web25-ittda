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

@ValidatorConstraint({ name: 'MediaValueConstraint', async: false })
class MediaValueConstraint implements ValidatorConstraintInterface {
  validate(value: unknown, args?: ValidationArguments): boolean {
    const target = args?.object as PostBlockDto | undefined;
    if (!target || target.type !== PostBlockType.MEDIA) return true;
    if (!value || typeof value !== 'object') return false;
    const media = value as {
      title?: unknown;
      type?: unknown;
      externalId?: unknown;
      year?: unknown;
      imageUrl?: unknown;
      originalTitle?: unknown;
    };
    if (typeof media.title !== 'string' || media.title.trim().length === 0) {
      return false;
    }
    if (typeof media.type !== 'string' || media.type.trim().length === 0) {
      return false;
    }
    if (
      typeof media.externalId !== 'string' ||
      media.externalId.trim().length === 0
    ) {
      return false;
    }
    const hasValidYear =
      media.year === undefined || typeof media.year === 'string';
    const hasValidImageUrl =
      media.imageUrl === undefined || typeof media.imageUrl === 'string';
    const hasValidOriginalTitle =
      media.originalTitle === undefined ||
      media.originalTitle === null ||
      typeof media.originalTitle === 'string';
    return hasValidYear && hasValidImageUrl && hasValidOriginalTitle;
  }

  defaultMessage(): string {
    return 'media must include non-empty title, type, and externalId';
  }
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
