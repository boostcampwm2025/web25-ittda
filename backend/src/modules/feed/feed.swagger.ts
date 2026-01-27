import { applyDecorators } from '@nestjs/common';
import { ApiExtraModels, ApiOkResponse, getSchemaPath } from '@nestjs/swagger';

import { FeedCardResponseDto } from './dto/feed-card.response.dto';

export const ApiFeedOkResponse = () =>
  applyDecorators(
    ApiExtraModels(FeedCardResponseDto),
    ApiOkResponse({
      schema: {
        type: 'object',
        properties: {
          success: { type: 'boolean', example: true },
          data: {
            type: 'array',
            items: { $ref: getSchemaPath(FeedCardResponseDto) },
          },
          meta: {
            type: 'object',
            properties: {
              warnings: { type: 'array', items: { type: 'object' } },
              feedLength: { type: 'number', example: 3 },
            },
            example: { warnings: [], feedLength: 3 },
          },
          error: { type: 'null', example: null },
        },
        required: ['success', 'data', 'meta', 'error'],
      },
    }),
  );
