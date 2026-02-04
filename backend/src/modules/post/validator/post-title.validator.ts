import { BadRequestException } from '@nestjs/common';

export function validatePostTitle(title: unknown) {
  if (typeof title !== 'string' || title.trim().length === 0) {
    throw new BadRequestException('title must not be empty.');
  }
}
