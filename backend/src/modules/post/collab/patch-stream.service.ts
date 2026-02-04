import { HttpException, Injectable } from '@nestjs/common';
import { WsException } from '@nestjs/websockets';
import { isUUID } from 'class-validator';
import type { Server, Socket } from 'socket.io';

import { DraftStateService } from './draft-state.service';
import { LockService } from './lock.service';
import { DraftQueueService } from './draft-queue.service';
import { PostDraftService } from '../post-draft.service';
import type { PatchApplyPayload, StreamPayload } from './types';
import { acquireLockWithEmit } from './lock-events';

@Injectable()
export class PatchStreamService {
  constructor(
    private readonly lockService: LockService,
    private readonly draftStateService: DraftStateService,
    private readonly postDraftService: PostDraftService,
    private readonly draftQueueService: DraftQueueService,
  ) {}

  handleBlockValueStream(
    server: Server,
    socket: Socket,
    room: string,
    draftId: string,
    sessionId: string,
    payload: StreamPayload,
  ) {
    this.ensureNotPublishing(draftId);
    const blockId = payload?.blockId;
    if (!blockId || !isUUID(blockId)) {
      throw new WsException('blockId must be a UUID.');
    }
    this.ensureLockOwner(draftId, sessionId, blockId);

    server.to(room).emit('BLOCK_VALUE_STREAM', {
      blockId,
      partialValue: payload.partialValue ?? null,
      sessionId,
    });
  }

  async handlePatchApply(
    server: Server,
    socket: Socket,
    room: string,
    draftId: string,
    actorId: string,
    sessionId: string,
    payload: PatchApplyPayload,
  ) {
    this.ensureNotPublishing(draftId);
    if (!payload) {
      throw new WsException('payload is required.');
    }
    if (payload.draftId === undefined || payload.draftId === null) {
      throw new WsException('draftId is required.');
    }
    if (payload.draftId !== draftId) {
      throw new WsException('draftId mismatch.');
    }
    if (typeof payload.baseVersion !== 'number') {
      throw new WsException('baseVersion must be a number.');
    }
    if (!payload.patch) {
      throw new WsException('patch is required.');
    }

    const commands = Array.isArray(payload.patch)
      ? payload.patch
      : [payload.patch];
    const insertedBlockIds = commands
      .filter((command) => command.type === 'BLOCK_INSERT')
      .map((command) => command.block?.id)
      .filter((blockId): blockId is string => Boolean(blockId));

    for (const command of commands) {
      if (command.type === 'BLOCK_INSERT') {
        continue;
      }
      if (command.type === 'BLOCK_MOVE') {
        // Layout moves are allowed without locks.
        continue;
      }
      if (command.type === 'BLOCK_SET_TITLE') {
        this.ensureTitleLockOwner(draftId, sessionId);
        continue;
      }
      const blockId = 'blockId' in command ? command.blockId : null;
      if (!blockId) continue;
      if (!isUUID(blockId)) {
        throw new WsException('blockId must be a UUID.');
      }
      this.ensureLockOwner(draftId, sessionId, blockId);
    }
    // 잘못된 payload나 권한 없는 요청은 아예 큐에 들어가지 않음.
    await this.draftQueueService.run(draftId, async () => {
      type ApplyPatchResult = Awaited<
        ReturnType<PostDraftService['applyPatch']>
      >;
      let result: ApplyPatchResult;
      try {
        result = await this.postDraftService.applyPatch(
          draftId,
          payload.baseVersion,
          payload.patch,
        );
        // DB 업데이트, 상태 변경, 이벤트 브로드캐스트가 안전하게 순차 처리
      } catch (error) {
        if (error instanceof WsException) {
          throw error;
        }
        if (error instanceof HttpException) {
          const response = error.getResponse();
          const message =
            typeof response === 'string'
              ? response
              : ((response as { message?: string }).message ??
                error.message ??
                'Bad request');
          throw new WsException(message);
        }
        throw new WsException('Internal server error');
      }

      if (result.status === 'stale') {
        socket.emit('PATCH_REJECTED_STALE', {
          currentVersion: result.currentVersion,
        });
        return;
      }

      this.draftStateService.addTouchedBy(draftId, actorId);

      server.to(room).emit('PATCH_COMMITTED', {
        version: result.version,
        patch: payload.patch,
        authorSessionId: sessionId,
      });

      if (insertedBlockIds.length > 0) {
        insertedBlockIds.forEach((blockId) => {
          if (!isUUID(blockId)) return;
          const lockKey = `block:${blockId}`;
          const lockResult = acquireLockWithEmit(
            this.lockService,
            server,
            room,
            socket,
            draftId,
            lockKey,
            actorId,
            sessionId,
          );
          if (!lockResult.ok) return;
        });
      }
    });
  }

  private ensureNotPublishing(draftId: string) {
    if (this.draftStateService.isPublishing(draftId)) {
      throw new WsException('Draft is publishing.');
    }
  }

  private ensureLockOwner(draftId: string, sessionId: string, blockId: string) {
    const blockOwner = this.lockService.getActiveLockOwnerSessionId(
      draftId,
      `block:${blockId}`,
    );
    const tableOwner = this.lockService.getActiveLockOwnerSessionId(
      draftId,
      `table:${blockId}`,
    );
    if (blockOwner === sessionId || tableOwner === sessionId) {
      return;
    }
    throw new WsException('Lock owner only.');
  }

  private ensureTitleLockOwner(draftId: string, sessionId: string) {
    const owner = this.lockService.getActiveLockOwnerSessionId(
      draftId,
      'block:title',
    );
    if (owner === sessionId) {
      return;
    }
    throw new WsException('Lock owner only.');
  }
}
