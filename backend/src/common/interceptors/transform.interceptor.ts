import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import type { Response as ExpressResponse } from 'express';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

export interface ApiResponse<T> {
  success: true;
  data: T | Record<string, never>;
  meta: unknown;
  error: null;
} // 서버의 모든 응답 형식을 일관된 구조로 변환(Transform)

const isApiResponse = (value: unknown): value is ApiResponse<unknown> => {
  if (!value || typeof value !== 'object') return false;
  const candidate = value as ApiResponse<unknown>;
  return (
    candidate.success === true &&
    'data' in candidate &&
    'meta' in candidate &&
    'error' in candidate
  );
};

@Injectable()
export class TransformInterceptor<T> implements NestInterceptor<
  T,
  ApiResponse<T> | T
> {
  intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Observable<ApiResponse<T> | T> {
    const httpContext = context.switchToHttp();
    const response = httpContext.getResponse<ExpressResponse>();

    return next.handle().pipe(
      map((data) => {
        if (response.headersSent || response.statusCode === 204) {
          return data as T;
        }
        if (isApiResponse(data)) {
          return data as ApiResponse<T>;
        }

        return {
          // controller에서 data를 반환하면 자동으로 공통 응답 형식으로 변환
          success: true,
          data: (data ?? {}) as T,
          meta: {}, // 추후 페이지네이션 등 메타데이터 필요시 확장
          error: null,
        };
      }),
    );
  }
}
