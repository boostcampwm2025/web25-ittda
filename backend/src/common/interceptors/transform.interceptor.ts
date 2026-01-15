import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

export interface Response<T> {
  success: true;
  data: T | Record<string, never>;
  meta: unknown;
  error: null;
} // 서버의 모든 응답 형식을 일관된 구조로 변환(Transform)

@Injectable()
export class TransformInterceptor<T> implements NestInterceptor<
  T,
  Response<T>
> {
  intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Observable<Response<T>> {
    return next.handle().pipe(
      map((data) => ({
        // controller에서 data를 반환하면 자동으로 공통 응답 형식으로 변환
        success: true,
        data: (data ?? {}) as T,
        meta: {}, // 추후 페이지네이션 등 메타데이터 필요시 확장
        error: null,
      })),
    );
  }
}
