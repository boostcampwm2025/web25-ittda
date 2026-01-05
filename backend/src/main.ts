import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { AllHttpExceptionFilter } from '@/common/exception_filters/AllHttpExceptionFilter';
import { AllWsExceptionFilter } from '@/common/exception_filters/AllWsExceptionFilter';

import 'reflect-metadata';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.setGlobalPrefix('api'); // 기본: /api/~

  // 전역 예외 필터를 HTTP, WS에 대해 분리
  // HTTP 전역 예외 필터 설정
  app.useGlobalFilters(new AllHttpExceptionFilter());

  // WS 전역 예외 필터 설정
  app.useGlobalFilters(new AllWsExceptionFilter());

  await app.listen(process.env.PORT ?? 4000); // next랑 3000겹쳐서 4000함
}
void bootstrap();
