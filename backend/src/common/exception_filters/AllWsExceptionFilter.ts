import { Socket } from 'socket.io';

import { ArgumentsHost, Catch, ExceptionFilter, Logger } from '@nestjs/common';
import { WsException } from '@nestjs/websockets';

@Catch(WsException)
export class AllWsExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllWsExceptionFilter.name);

  catch(exception: WsException, host: ArgumentsHost) {
    const ctx = host.switchToWs();
    const client = ctx.getClient<Socket>();

    const errorResponse = {
      code: 'WS_ERROR',
      message: exception.message,
    };

    this.logger.error(
      `[WS Exception] Client: ${client.id}, Error: ${exception.message}`,
      exception.stack,
    );

    client.emit('error', errorResponse);
  }
}
