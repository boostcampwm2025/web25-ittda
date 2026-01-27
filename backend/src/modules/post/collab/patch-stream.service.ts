import { Injectable } from '@nestjs/common';
import { WsException } from '@nestjs/websockets';
import { isUUID } from 'class-validator';
import type { Server, Socket } from 'socket.io';

import { DraftStateService } from './draft-state.service';
import { LockService } from './lock.service';
import { PostDraftService } from '../post-draft.service';
import type { PatchApplyPayload, StreamPayload } from './types';
import { acquireLockWithEmit } from './lock-events';

@Injectable()
export class PatchStreamService {
  constructor(
    private readonly lockService: LockService,
    private readonly draftStateService: DraftStateService,
    private readonly postDraftService: PostDraftService,
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
    if (!payload?.draftId || payload.draftId !== draftId) {
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

    const result = await this.postDraftService.applyPatch(
      draftId,
      payload.baseVersion,
      payload.patch,
    );
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
