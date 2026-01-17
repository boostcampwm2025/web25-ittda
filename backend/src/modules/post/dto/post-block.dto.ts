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

@ApiExtraModels(MoodValueDto)
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
  @ApiProperty({
    description: 'Block value. When type=MOOD, mood enum is enforced.',
    oneOf: [
      { type: 'object', additionalProperties: true },
      { $ref: getSchemaPath(MoodValueDto) },
    ],
  })
  value: BlockValueMap[PostBlockType];

  @ApiProperty({ type: () => BlockLayoutDto })
  @ValidateNested()
  @Type(() => BlockLayoutDto)
  layout: BlockLayoutDto;
}
