import { randomUUID } from 'crypto';
import { Response } from 'express';
import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';

interface NestExceptionResponse {
  message?: string | string[];
  code?: string;
}

const SAFE_MESSAGES: Partial<Record<HttpStatus, string>> = {
  [HttpStatus.BAD_REQUEST]: '잘못된 요청입니다.',
  [HttpStatus.UNAUTHORIZED]: '로그인이 필요합니다.',
  [HttpStatus.FORBIDDEN]: '이 작업을 수행할 권한이 없습니다.',
  [HttpStatus.NOT_FOUND]: '요청한 정보를 찾을 수 없습니다.',
  [HttpStatus.CONFLICT]: '이미 처리된 요청이거나 중복된 데이터입니다.',
  [HttpStatus.TOO_MANY_REQUESTS]:
    '요청이 너무 많습니다. 잠시 후 다시 시도해 주세요.',
};

const INTERNAL_SERVER_ERROR_MESSAGE =
  '일시적인 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.';

@Catch()
export class AllHttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllHttpExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const requestId = this.getRequestId();
    const status = this.getStatus(exception);
    const error = this.normalizeError(exception, status);

    const resBody = {
      success: false as const,
      data: null,
      error: {
        ...error,
        requestId,
      },
    };

    this.logException(status, exception, requestId);

    if (!response.headersSent) {
      response.setHeader('X-Request-Id', requestId);
      response.status(status).json(resBody);
    }
  }

  private getStatus(exception: unknown): HttpStatus {
    return exception instanceof HttpException
      ? exception.getStatus()
      : HttpStatus.INTERNAL_SERVER_ERROR;
  }

  private normalizeError(
    exception: unknown,
    status: HttpStatus,
  ): { code: string; message: string } {
    if (status >= HttpStatus.INTERNAL_SERVER_ERROR) {
      return {
        code: 'INTERNAL_SERVER_ERROR',
        message: INTERNAL_SERVER_ERROR_MESSAGE,
      };
    }

    const exceptionResponse =
      exception instanceof HttpException ? exception.getResponse() : undefined;
    const body =
      typeof exceptionResponse === 'object' && exceptionResponse !== null
        ? (exceptionResponse as NestExceptionResponse)
        : undefined;

    // A custom code marks an exception as intentionally safe for clients.
    if (body?.code) {
      return {
        code: body.code,
        message: this.getMessage(body.message, status),
      };
    }

    if (status === HttpStatus.BAD_REQUEST && Array.isArray(body?.message)) {
      return {
        code: 'VALIDATION_ERROR',
        message: '입력값을 확인해 주세요.',
      };
    }

    return {
      code: HttpStatus[status] ?? 'BAD_REQUEST',
      message: SAFE_MESSAGES[status] ?? '요청을 처리할 수 없습니다.',
    };
  }

  private getMessage(
    message: NestExceptionResponse['message'],
    status: HttpStatus,
  ): string {
    if (typeof message === 'string' && message.trim()) {
      return message;
    }

    return SAFE_MESSAGES[status] ?? '요청을 처리할 수 없습니다.';
  }

  // 클라이언트가 보낸 x-request-id를 그대로 신뢰하면, 임의 값(예: 실제 다른
  // 요청의 ID)을 재사용해 예외 로그를 다른 요청과 뒤섞을 수 있다. 프런트도
  // 이 헤더를 보내지 않으므로 서버가 항상 직접 발급한다.
  private getRequestId(): string {
    return `req_${randomUUID()}`;
  }

  private logException(
    status: HttpStatus,
    exception: unknown,
    requestId: string,
  ) {
    const stack = exception instanceof Error ? exception.stack : undefined;
    const exceptionDetails = this.getExceptionDetails(exception);
    const logMessage = `[Exception] requestId=${requestId} status=${status} exception=${exceptionDetails}`;

    if (status >= HttpStatus.INTERNAL_SERVER_ERROR) {
      this.logger.error(logMessage, stack);
    } else {
      this.logger.warn(logMessage);
    }
  }

  private getExceptionDetails(exception: unknown): string {
    if (exception instanceof HttpException) {
      return `${exception.name}: ${exception.message}, response=${this.stringifyException(exception.getResponse())}`;
    }

    if (exception instanceof Error) {
      return `${exception.name}: ${exception.message}`;
    }

    return this.stringifyException(exception);
  }

  private stringifyException(exception: unknown): string {
    try {
      return JSON.stringify(exception);
    } catch {
      return String(exception);
    }
  }
}
