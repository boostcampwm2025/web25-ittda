import { Socket } from 'socket.io';

import { ArgumentsHost, Catch, ExceptionFilter, Logger } from '@nestjs/common';
import { WsException } from '@nestjs/websockets';

@Catch()
export class AllWsExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllWsExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToWs();
    const client = ctx.getClient<Socket>();

    const isWsException = exception instanceof WsException;
    const message = isWsException
      ? exception.message
      : exception instanceof Error
        ? exception.message
        : 'Internal server error';

    const errorResponse = {
      code: isWsException ? 'WS_ERROR' : 'INTERNAL_ERROR',
      message,
    };

    if (isWsException) {
      this.logger.warn(
        `[WS Exception] Client: ${client.id}, Error: ${message}`,
      );
    } else {
      this.logger.error(
        `[WS Unhandled Exception] Client: ${client.id}, Error: ${message}`,
        exception instanceof Error ? exception.stack : String(exception),
      );
    }

    client.emit('exception', errorResponse);
  }
}
