import { Socket } from 'socket.io';

import { ArgumentsHost, Catch, ExceptionFilter, Logger } from '@nestjs/common';
import { WsException } from '@nestjs/websockets';

@Catch()
export class AllWsExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllWsExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToWs();
    const client = ctx.getClient<Socket>();

    if (exception instanceof WsException) {
      const message = exception.message;
      this.logger.warn(
        `[WS Exception] Client: ${client.id}, Error: ${message}`,
      );
      client.emit('exception', { code: 'WS_ERROR', message });
      return;
    }

    const message =
      exception instanceof Error ? exception.message : 'Internal server error';

    this.logger.error(
      `[WS Unhandled Exception] Client: ${client.id}, Error: ${message}`,
      exception instanceof Error ? exception.stack : String(exception),
    );
    client.emit('exception', { code: 'INTERNAL_ERROR', message });
  }
}
