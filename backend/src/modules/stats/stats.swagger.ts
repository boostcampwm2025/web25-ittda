import { applyDecorators } from '@nestjs/common';
import { ApiExtraModels, ApiOkResponse, getSchemaPath } from '@nestjs/swagger';

import { EmotionSummaryResponseDto } from './dto/emotion-summary.response.dto';

export const ApiEmotionStatsOkResponse = () =>
  applyDecorators(
    ApiExtraModels(EmotionSummaryResponseDto),
    ApiOkResponse({
      schema: {
        type: 'object',
        properties: {
          success: { type: 'boolean', example: true },
          data: {
            type: 'array',
            items: { $ref: getSchemaPath(EmotionSummaryResponseDto) },
          },
          meta: {
            type: 'object',
            properties: { totalCount: { type: 'number', example: 6 } },
            example: { totalCount: 5 },
          },
          error: { type: 'null', example: null },
        },
        required: ['success', 'data', 'meta', 'error'],
      },
    }),
  );
