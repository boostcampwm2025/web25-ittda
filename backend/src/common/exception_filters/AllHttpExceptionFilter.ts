import { Response } from 'express';
import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';

// NestJS HttpException 응답 객체의 표준 구조 인터페이스 정의
interface NestExceptionResponse {
  message?: string | string[];
  error?: string;
  code?: string;
  details?: Record<string, unknown>;
}

@Catch()
export class AllHttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllHttpExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();

    const status =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;

    const exceptionResponse =
      exception instanceof HttpException
        ? exception.getResponse()
        : {
            message: (exception as Error)?.message || 'Internal Server Error',
            error: 'Internal Server Error',
          };

    // 초기값 설정
    let code: string = HttpStatus[status] || 'INTERNAL_SERVER_ERROR';
    let message = 'An error occurred';
    let details: Record<string, unknown> = {};

    if (typeof exceptionResponse === 'string') {
      message = exceptionResponse;
    } else if (
      typeof exceptionResponse === 'object' &&
      exceptionResponse !== null
    ) {
      // 타입 단언을 통해 any 제거
      const body = exceptionResponse as NestExceptionResponse;

      // message 처리
      if (body.message) {
        message = Array.isArray(body.message)
          ? body.message.join(', ')
          : body.message;
      }

      // code 처리
      if (body.code) {
        code = body.code;
      } else if (body.error) {
        code = body.error.toUpperCase().replace(/ /g, '_');
      }

      // details 처리
      if (body.details) {
        details = body.details;
      }
    }

    const resBody = {
      success: false as const,
      data: null,
      error: {
        code,
        message,
        details,
      },
    };

    // 로깅 및 응답 전송 로직
    this.logException(status, exception, resBody);

    if (!response.headersSent) {
      response.status(status).json(resBody);
    }
  }

  private logException(status: number, exception: unknown, resBody: unknown) {
    const stack = exception instanceof Error ? exception.stack : undefined;
    const logMsg = `[Exception] Status: ${status}, Body: ${JSON.stringify(resBody)}`;

    if (status >= 500) {
      this.logger.error(logMsg, stack);
    } else {
      this.logger.warn(logMsg);
    }
  }
}
