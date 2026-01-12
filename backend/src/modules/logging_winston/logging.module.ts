import { Module } from '@nestjs/common';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { WinstonModule } from 'nest-winston';
import { createLoggerOptions } from '@/config/winston';
import { LoggingInterceptor } from './logging.interceptor';

/**
 * 서버 전역에서 사용할 winston 로거와 로깅 인터셉터를 구성하는 모듈이다.
 */
@Module({
  imports: [WinstonModule.forRoot(createLoggerOptions())],
  providers: [
    {
      provide: APP_INTERCEPTOR,
      useClass: LoggingInterceptor,
    },
  ],
  exports: [WinstonModule],
})
export class LoggingModule {}
