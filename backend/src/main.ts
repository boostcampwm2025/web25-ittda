import { NestFactory } from '@nestjs/core';
import { VersioningType, ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';
import { AllHttpExceptionFilter } from '@/common/exception_filters/AllHttpExceptionFilter';
import { AllWsExceptionFilter } from '@/common/exception_filters/AllWsExceptionFilter';
import cookieParser from 'cookie-parser';

import 'reflect-metadata';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.use(cookieParser());

  app.enableVersioning({
    type: VersioningType.URI,
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true, // DTO에 없는 속성은 제거
      forbidNonWhitelisted: true, // DTO에 없는 속성 포함 시 에러 발생
      transform: true, // 자동 타입 변환
    }),
  );

  // 전역 예외 필터를 HTTP, WS에 대해 분리
  // ✅ 모든 필터를 한 번에 등록
  app.useGlobalFilters(
    new AllHttpExceptionFilter(),
    new AllWsExceptionFilter(),
  );

  // CORS 설정
  app.enableCors({
    origin: ['http://localhost:3000', 'http://211.188.48.38'], // FE 주소(TODO: 도메인으로 변경)
    credentials: true, // 쿠키/세션 허용
  });

  await app.listen(process.env.PORT ?? 4000); // next랑 3000겹쳐서 4000함
}
void bootstrap();
