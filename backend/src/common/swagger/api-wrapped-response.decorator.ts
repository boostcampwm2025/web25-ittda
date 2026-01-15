import { applyDecorators, type Type } from '@nestjs/common';
import {
  ApiCreatedResponse,
  ApiExtraModels,
  ApiOkResponse,
  getSchemaPath,
} from '@nestjs/swagger';

type WrappedResponseOptions = {
  type: Type<unknown>;
  isArray?: boolean;
  description?: string;
};

const buildSchema = (options: WrappedResponseOptions) => ({
  type: 'object',
  properties: {
    success: { type: 'boolean', example: true },
    data: options.isArray
      ? { type: 'array', items: { $ref: getSchemaPath(options.type) } }
      : { $ref: getSchemaPath(options.type) },
    meta: { type: 'object', example: {} },
    error: { type: 'null', example: null },
  },
  required: ['success', 'data', 'meta', 'error'],
});

export const ApiWrappedOkResponse = (options: WrappedResponseOptions) =>
  applyDecorators(
    ApiExtraModels(options.type),
    ApiOkResponse({
      description: options.description,
      schema: buildSchema(options),
    }),
  );

export const ApiWrappedCreatedResponse = (options: WrappedResponseOptions) =>
  applyDecorators(
    ApiExtraModels(options.type),
    ApiCreatedResponse({
      description: options.description,
      schema: buildSchema(options),
    }),
  );
