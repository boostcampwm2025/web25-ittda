import {
  ValidationArguments,
  ValidatorConstraint,
  ValidatorConstraintInterface,
} from 'class-validator';
import { PostBlockType } from '@/enums/post-block-type.enum';
import { PostMood } from '@/enums/post-mood.enum';

type BlockWithType = {
  type?: PostBlockType;
  value?: unknown;
  __mediaValidationMessage?: string;
};

@ValidatorConstraint({ name: 'MoodValueConstraint', async: false })
export class MoodValueConstraint implements ValidatorConstraintInterface {
  validate(value: unknown, args?: ValidationArguments): boolean {
    const target = args?.object as BlockWithType | undefined;
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
export class LocationValueConstraint implements ValidatorConstraintInterface {
  validate(value: unknown, args?: ValidationArguments): boolean {
    const target = args?.object as BlockWithType | undefined;
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
export class RatingValueConstraint implements ValidatorConstraintInterface {
  validate(value: unknown, args?: ValidationArguments): boolean {
    const target = args?.object as BlockWithType | undefined;
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
export class MediaValueConstraint implements ValidatorConstraintInterface {
  validate(value: unknown, args?: ValidationArguments): boolean {
    const target = args?.object as BlockWithType | undefined;
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
      target.__mediaValidationMessage = 'media.title is required';
      return false;
    }
    if (typeof media.type !== 'string' || media.type.trim().length === 0) {
      target.__mediaValidationMessage = 'media.type is required';
      return false;
    }
    if (
      typeof media.externalId !== 'string' ||
      media.externalId.trim().length === 0
    ) {
      target.__mediaValidationMessage = 'media.externalId is required';
      return false;
    }
    const hasValidYear =
      media.year === undefined ||
      (typeof media.year === 'string' && /^\d{4}$/.test(media.year));
    const hasValidImageUrl =
      media.imageUrl === undefined || typeof media.imageUrl === 'string';
    const hasValidOriginalTitle =
      media.originalTitle === undefined ||
      media.originalTitle === null ||
      typeof media.originalTitle === 'string';
    if (!hasValidYear) {
      target.__mediaValidationMessage = 'media.year must be YYYY when provided';
      return false;
    }
    if (!hasValidImageUrl) {
      target.__mediaValidationMessage =
        'media.imageUrl must be a string when provided';
      return false;
    }
    if (!hasValidOriginalTitle) {
      target.__mediaValidationMessage =
        'media.originalTitle must be a string when provided';
      return false;
    }
    delete target.__mediaValidationMessage;
    return true;
  }

  defaultMessage(args?: ValidationArguments): string {
    const target = args?.object as BlockWithType | undefined;
    return target?.__mediaValidationMessage || 'media value is invalid';
  }
}
