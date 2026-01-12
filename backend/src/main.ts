import { NestFactory } from '@nestjs/core';
import { VersioningType } from '@nestjs/common';
import { AppModule } from './app.module';
import { AllHttpExceptionFilter } from '@/common/exception_filters/AllHttpExceptionFilter';
import { AllWsExceptionFilter } from '@/common/exception_filters/AllWsExceptionFilter';

import 'reflect-metadata';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.enableVersioning({
    type: VersioningType.URI,
  });

  // 전역 예외 필터를 HTTP, WS에 대해 분리
  // HTTP 전역 예외 필터 설정
  app.useGlobalFilters(new AllHttpExceptionFilter());

  // WS 전역 예외 필터 설정
  app.useGlobalFilters(new AllWsExceptionFilter());

  // CORS 설정
  app.enableCors({
    origin: ['http://localhost:3000', 'http://211.188.48.38'], // FE 주소(TODO: 도메인으로 변경)
    credentials: true, // 쿠키/세션 허용
  });

  await app.listen(process.env.PORT ?? 4000); // next랑 3000겹쳐서 4000함
}
void bootstrap();
