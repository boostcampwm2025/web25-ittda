import {
  CallHandler,
  ExecutionContext,
  Inject,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { catchError, tap } from 'rxjs/operators';
import { Observable, throwError } from 'rxjs';

import type { Request, Response } from 'express';
import type { Logger } from 'winston';

type HttpRequest = Request & {
  originalUrl?: string;
};

/**
 * HTTP 요청에 대한 전/후처리 로그를 생성하는 인터셉터다.
 * 요청 메타데이터와 응답 시간, 예외 정보를 winston 로거로 기록한다.
 */
@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  constructor(
    @Inject(WINSTON_MODULE_PROVIDER)
    private readonly logger: Logger,
  ) {}

  /**
   * Nest 인터셉터 훅으로 요청 흐름을 감싸고 로그를 남긴다.
   *
   * @param context 실행 컨텍스트
   * @param next 다음 핸들러
   * @returns 요청 처리 결과 스트림
   */
  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const httpContext = context.switchToHttp();
    const request = httpContext.getRequest<HttpRequest>();
    const response = httpContext.getResponse<Response>();

    if (!request || !response) {
      return next.handle();
    }

    const startAt = Date.now();
    const contextLabel = this.resolveContextName(context);
    const method = request.method;
    const path = request.originalUrl ?? request.url;
    this.logger.info({
      context: contextLabel,
      message: `${method} ${path} - request received`,
      method,
      path,
    });

    return next.handle().pipe(
      tap((data) => {
        const durationMs = Date.now() - startAt;
        const statusCode = response.statusCode;

        this.logger.info({
          context: contextLabel,
          message: `${method} ${path} ${statusCode} ${durationMs}ms`,
          method,
          path,
          statusCode,
          durationMs,
          responseBody: this.resolveResponsePreview(data),
        });
      }),
      catchError((error) => {
        const durationMs = Date.now() - startAt;
        const statusCode = this.resolveErrorStatus(error);

        const stackTrace = error instanceof Error ? error.stack : undefined;
        const errorMessage = this.getErrorMessage(error);

        this.logger.error({
          context: contextLabel,
          message: `${method} ${path} ${statusCode} ${durationMs}ms - ${errorMessage}`,
          method,
          path,
          statusCode,
          durationMs,
          stack: stackTrace,
        });

        return throwError(() =>
          error instanceof Error ? error : new Error(String(error)),
        );
      }),
    );
  }

  /**
   * 현재 실행중인 컨트롤러/핸들러 이름을 기반으로 로그 컨텍스트 문자열을 생성한다.
   *
   * @param context 실행 컨텍스트
   * @returns 컨텍스트 레이블
   */
  private resolveContextName(context: ExecutionContext): string {
    const targetClass = context.getClass();
    const handler = context.getHandler();
    const className = targetClass?.name ?? 'UnknownClass';
    const handlerName = handler?.name ?? 'unknownHandler';

    return `${className}.${handlerName}`;
  }

  /**
   * 응답 데이터를 로그에 포함하기 적절한 형태로 축약한다.
   *
   * @param data 응답 데이터
   * @returns 로그용 응답 미리보기
   */
  private resolveResponsePreview(data: unknown): unknown {
    if (data === undefined || data === null) {
      return data;
    }

    if (typeof data === 'string') {
      return data.length > 200 ? `${data.slice(0, 200)}...` : data;
    }

    if (Array.isArray(data)) {
      return { type: 'array', length: data.length };
    }

    if (typeof data === 'object') {
      return data;
    }

    return data;
  }

  /**
   * 예외 객체에서 HTTP 상태 코드를 추출한다.
   *
   * @param error 처리 중 발생한 예외
   * @returns 추정 가능한 HTTP 상태 코드
   */
  private resolveErrorStatus(error: unknown): number | string {
    if (typeof error === 'object' && error !== null) {
      const maybeWithStatus = error as {
        status?: number;
        statusCode?: number;
        getStatus?: () => number;
      };

      if (typeof maybeWithStatus.status === 'number') {
        return maybeWithStatus.status;
      }
      if (typeof maybeWithStatus.statusCode === 'number') {
        return maybeWithStatus.statusCode;
      }
      if (typeof maybeWithStatus.getStatus === 'function') {
        return maybeWithStatus.getStatus();
      }
    }

    return 'UNKNOWN';
  }

  /**
   * 예외 객체에서 메시지를 추출한다.
   *
   * @param error 예외 객체
   * @returns 예외 메시지
   */
  private getErrorMessage(error: unknown): string {
    if (error instanceof Error) return error.message;
    if (typeof error === 'string') return error;
    try {
      return JSON.stringify(error);
    } catch {
      return String(error);
    }
  }
}
