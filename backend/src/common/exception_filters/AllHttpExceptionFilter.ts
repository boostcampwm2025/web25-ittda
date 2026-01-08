import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  Logger,
} from '@nestjs/common';

import type { Response } from 'express';

@Catch(HttpException)
export class AllHttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllHttpExceptionFilter.name);

  catch(exception: HttpException, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();

    const status = exception.getStatus();
    const responseBody = exception.getResponse();

    const resBody =
      typeof responseBody === 'string'
        ? { statusCode: status, message: responseBody }
        : responseBody;

    this.logger.error(
      `[HTTP Exception] Status: ${status}, Response: ${JSON.stringify(resBody)}`,
      exception.stack,
    );

    if (!response.headersSent) {
      // ERR_HTTP_HEADERS_SENT 때문에 헤더 전송 체크 추가
      response.status(status).json(resBody);
    }
  }
}
