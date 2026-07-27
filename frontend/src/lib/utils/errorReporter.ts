import * as Sentry from '@sentry/nextjs';
import { ERROR_CODES, type ApiError } from './errorHandler';

const REPORTABLE_ERROR_CODES = new Set<string>([
  ERROR_CODES.INTERNAL_SERVER_ERROR,
  ERROR_CODES.TIMEOUT,
]);

const ALREADY_REPORTED_ERROR_CODES = new Set([
  ERROR_CODES.NETWORK_ERROR,
  'PARSE_ERROR',
]);

const EXPECTED_ERROR_CODES = new Set<string>(
  Object.values(ERROR_CODES).filter(
    (code) =>
      !REPORTABLE_ERROR_CODES.has(code) &&
      !ALREADY_REPORTED_ERROR_CODES.has(code),
  ),
);

export function captureSystemError(
  error: unknown,
  source: 'query' | 'mutation',
): boolean {
  const metadata = getErrorMetadata(error);

  if (!shouldCapture(metadata.code)) {
    return false;
  }

  Sentry.captureException(error, {
    level: 'error',
    tags: {
      context: 'api-error',
      source,
      errorCode: metadata.code ?? 'UNKNOWN',
      requestId: metadata.requestId ?? 'UNKNOWN',
    },
    extra: {
      errorCode: metadata.code,
      requestId: metadata.requestId,
    },
  });

  return true;
}

function shouldCapture(code?: string): boolean {
  if (!code) {
    return true;
  }

  if (ALREADY_REPORTED_ERROR_CODES.has(code)) {
    return false;
  }

  if (REPORTABLE_ERROR_CODES.has(code)) {
    return true;
  }

  return !EXPECTED_ERROR_CODES.has(code);
}

function getErrorMetadata(
  error: unknown,
): Pick<ApiError, 'code' | 'requestId'> {
  if (!error || typeof error !== 'object') {
    return {};
  }

  const code =
    'code' in error && typeof error.code === 'string' ? error.code : undefined;
  const requestId =
    'requestId' in error && typeof error.requestId === 'string'
      ? error.requestId
      : undefined;

  return { code, requestId };
}
