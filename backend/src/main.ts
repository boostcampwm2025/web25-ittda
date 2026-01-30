import { NestFactory } from '@nestjs/core';
import { ValidationPipe, VersioningType } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { AllHttpExceptionFilter } from '@/common/exception_filters/AllHttpExceptionFilter';
import { AllWsExceptionFilter } from '@/common/exception_filters/AllWsExceptionFilter';
import { TransformInterceptor } from '@/common/interceptors/transform.interceptor';
import cookieParser from 'cookie-parser';
import helmet from 'helmet';

import 'reflect-metadata';

import type { SwaggerCustomOptions } from '@nestjs/swagger';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.use(cookieParser());

  app.use(helmet({ xPoweredBy: false })); // Express가 사용하는 헤더를 숨겨 기술 스택 노출을 방지

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

  // ✅ 전역 응답 인터셉터 등록 (성공 응답 통일)
  app.useGlobalInterceptors(new TransformInterceptor());

  // CORS 설정
  app.enableCors({
    origin: [process.env.FRONTEND_URL], // FE 주소 (개발, 운영)
    credentials: true, // 쿠키/세션 허용
    exposedHeaders: ['Authorization'], // Access Token을 헤더로 보낼 경우 필수
  });

  const swaggerConfig = new DocumentBuilder()
    .setTitle('ITTDA API')
    .setDescription('ITTDA backend API docs')
    .setVersion('1.0')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        in: 'header',
      },
      'bearerAuth',
      // 이 이름은 컨트롤러의 @ApiBearerAuth('bearerAuth')와 일치해야 함
    )
    .build();

  const swaggerCustomOptions: SwaggerCustomOptions = {
    swaggerOptions: {
      persistAuthorization: true,
      // 페이지를 새로고침해도 입력한 토큰이 날아가지 않고 유지
    },
  };

  const swaggerDocument = SwaggerModule.createDocument(app, swaggerConfig);
  swaggerDocument.security = [{ bearerAuth: [] }]; // 모든 API에 전역적으로 bearerAuth 인증을 적용하라
  SwaggerModule.setup('docs', app, swaggerDocument, swaggerCustomOptions);

  await app.listen(process.env.PORT ?? 4000); // next랑 3000겹쳐서 4000함
}
void bootstrap();
// swaggerDocument.security 설정을 지우고, 인증이 필요한 컨트롤러에만 @ApiBearerAuth()를 붙입니다. (추천: 직관적임)
// 지금은 편의상 전역적으로 .addSecurityRequirements('bearerAuth') 설정한 상태입니다.
