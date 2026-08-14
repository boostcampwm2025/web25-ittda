import { randomUUID } from 'crypto';
import { Socket } from 'socket.io';

import { ArgumentsHost, Catch, ExceptionFilter, Logger } from '@nestjs/common';
import { WsException } from '@nestjs/websockets';

interface SafeWsError {
  code: string;
  message: string;
}

const WS_ERROR_MAP: Record<string, SafeWsError> = {
  'Access token is required.': {
    code: 'UNAUTHORIZED',
    message: '로그인이 필요합니다.',
  },
  'Invalid access token.': {
    code: 'INVALID_TOKEN',
    message: '유효하지 않은 인증 정보입니다. 다시 로그인해 주세요.',
  },
  'Draft is full.': {
    code: 'WS_DRAFT_FULL',
    message: '참여 인원이 가득 찼습니다.',
  },
  'draftId mismatch.': {
    code: 'WS_STALE_EVENT',
    message: '유효하지 않은 실시간 요청입니다.',
  },
  'Group membership is required.': {
    code: 'WS_FORBIDDEN',
    message: '이 작업을 수행할 권한이 없습니다.',
  },
  'Insufficient permission.': {
    code: 'WS_FORBIDDEN',
    message: '이 작업을 수행할 권한이 없습니다.',
  },
  'Lock owner only.': {
    code: 'WS_LOCK_DENIED',
    message: '현재 편집 권한이 없습니다.',
  },
  'Session is not initialized.': {
    code: 'WS_SESSION_INVALID',
    message: '실시간 연결 상태가 유효하지 않습니다.',
  },
  'Draft not found.': {
    code: 'WS_NOT_FOUND',
    message: '요청한 정보를 찾을 수 없습니다.',
  },
  'User not found.': {
    code: 'WS_NOT_FOUND',
    message: '요청한 정보를 찾을 수 없습니다.',
  },
};

const VALIDATION_MESSAGES = new Set([
  'groupId must be a UUID.',
  'groupId mismatch.',
  'draftId must be a UUID.',
  'draftId is required.',
  'actorId is invalid.',
  'payload is required.',
  'lockKey is invalid.',
  'blockId must be a UUID.',
  'baseVersion must be a number.',
  'patch is required.',
]);

@Catch()
export class AllWsExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllWsExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToWs();
    const client = ctx.getClient<Socket>();
    const requestId = `req_${randomUUID()}`;

    if (exception instanceof WsException) {
      const rawMessage = this.getRawMessage(exception);
      const error = this.normalizeKnownError(rawMessage);

      this.logger.warn(
        `[WS Exception] requestId=${requestId} clientId=${client.id} exception=${rawMessage}`,
      );
      client.emit('exception', { ...error, requestId });
      return;
    }

    const rawMessage =
      exception instanceof Error ? exception.message : String(exception);
    this.logger.error(
      `[WS Unhandled Exception] requestId=${requestId} clientId=${client.id} exception=${rawMessage}`,
      exception instanceof Error ? exception.stack : undefined,
    );
    client.emit('exception', {
      code: 'WS_INTERNAL_ERROR',
      message: '일시적인 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.',
      requestId,
    });
  }

  private getRawMessage(exception: WsException): string {
    const error = exception.getError();

    if (
      typeof error === 'object' &&
      error !== null &&
      'message' in error &&
      typeof error.message === 'string'
    ) {
      return error.message;
    }

    return typeof error === 'string' ? error : exception.message;
  }

  private normalizeKnownError(message: string): SafeWsError {
    const knownError = WS_ERROR_MAP[message];
    if (knownError) {
      return knownError;
    }

    if (VALIDATION_MESSAGES.has(message)) {
      return {
        code: 'WS_VALIDATION_ERROR',
        message: '실시간 요청 내용을 확인해 주세요.',
      };
    }

    return {
      code: 'WS_ERROR',
      message: '실시간 요청을 처리할 수 없습니다.',
    };
  }
}
