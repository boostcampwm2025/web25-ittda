import {
  HttpException,
  Injectable,
  Logger,
  OnModuleDestroy,
} from '@nestjs/common';
import { WsException } from '@nestjs/websockets';
import { isUUID } from 'class-validator';
import type { Server, Socket } from 'socket.io';

import { DraftStateService } from './draft-state.service';
import { LockService } from './lock.service';
import { PostDraftService } from '../post-draft.service';
import type { PatchApplyPayload, StreamPayload } from './types';
import { acquireLockWithEmit } from './lock-events';

@Injectable()
export class PatchStreamService implements OnModuleDestroy {
  private static readonly STREAM_DROP_BUFFER_LIMIT = 50;
  private static readonly STREAM_ROOM_BYPASS_LIMIT = 30;
  private static readonly STREAM_FLUSH_INTERVAL_MS = 250;
  private readonly streamBuffer = new Map<string, BufferedStream>();
  private readonly logger = new Logger(PatchStreamService.name);
  private streamFlushTimer?: NodeJS.Timeout;

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

    this.bufferStream(server, room, draftId, blockId, sessionId, payload);
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

    type ApplyPatchResult = Awaited<ReturnType<PostDraftService['applyPatch']>>;
    let result: ApplyPatchResult;
    try {
      result = await this.postDraftService.applyPatch(
        draftId,
        payload.baseVersion,
        payload.patch,
      );
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
  }

  private ensureNotPublishing(draftId: string) {
    if (this.draftStateService.isPublishing(draftId)) {
      throw new WsException('Draft is publishing.');
    }
  }

  onModuleDestroy() {
    if (this.streamFlushTimer) {
      clearTimeout(this.streamFlushTimer);
      this.streamFlushTimer = undefined;
    }
    this.streamBuffer.clear();
  }

  private bufferStream(
    server: Server,
    room: string,
    draftId: string,
    blockId: string,
    sessionId: string,
    payload: StreamPayload,
  ) {
    const key = `${draftId}:${blockId}:${sessionId}`;
    this.streamBuffer.set(key, {
      server,
      room,
      draftId,
      blockId,
      sessionId,
      partialValue: payload.partialValue ?? null,
    });
    this.scheduleStreamFlush();
  }

  private scheduleStreamFlush() {
    if (this.streamFlushTimer) return;
    this.streamFlushTimer = setTimeout(() => {
      this.flushStreams();
    }, PatchStreamService.STREAM_FLUSH_INTERVAL_MS);
  }

  private flushStreams() {
    const entries = Array.from(this.streamBuffer.values());
    this.streamBuffer.clear();
    this.streamFlushTimer = undefined;
    const dropStats = new Map<string, number>();

    entries.forEach((entry) => {
      if (!this.isStreamOwner(entry.draftId, entry.blockId, entry.sessionId)) {
        return;
      }
      const dropped = this.emitStream(entry);
      if (dropped > 0) {
        dropStats.set(entry.room, (dropStats.get(entry.room) ?? 0) + dropped);
      }
    });

    dropStats.forEach((dropped, room) => {
      this.logger.warn(
        `BLOCK_VALUE_STREAM dropped=${dropped} room=${room} bufferLimit=${PatchStreamService.STREAM_DROP_BUFFER_LIMIT}`,
      );
    });

    if (this.streamBuffer.size > 0) {
      this.scheduleStreamFlush();
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

  private isStreamOwner(draftId: string, blockId: string, sessionId: string) {
    const blockOwner = this.lockService.getActiveLockOwnerSessionId(
      draftId,
      `block:${blockId}`,
    );
    const tableOwner = this.lockService.getActiveLockOwnerSessionId(
      draftId,
      `table:${blockId}`,
    );
    return blockOwner === sessionId || tableOwner === sessionId;
  }

  private emitStream(entry: BufferedStream) {
    const roomSockets = entry.server.sockets.adapter.rooms.get(entry.room);
    if (!roomSockets || roomSockets.size === 0) return 0;
    if (roomSockets.size >= PatchStreamService.STREAM_ROOM_BYPASS_LIMIT) {
      entry.server.to(entry.room).volatile.emit('BLOCK_VALUE_STREAM', {
        blockId: entry.blockId,
        partialValue: entry.partialValue,
        sessionId: entry.sessionId,
      });
      return 0;
    }
    const payload = {
      blockId: entry.blockId,
      partialValue: entry.partialValue,
      sessionId: entry.sessionId,
    };
    let dropped = 0;

    roomSockets.forEach((socketId) => {
      const socket = entry.server.sockets.sockets.get(socketId);
      if (!socket) return;
      const conn = socket.conn as unknown as {
        transport?: { writable?: boolean };
        writeBuffer?: unknown[];
      };
      if (!conn?.transport?.writable) {
        dropped += 1;
        return;
      }
      const bufferLength = conn.writeBuffer?.length ?? 0;
      if (bufferLength >= PatchStreamService.STREAM_DROP_BUFFER_LIMIT) {
        dropped += 1;
        return;
      }
      socket.volatile.emit('BLOCK_VALUE_STREAM', payload);
    });

    return dropped;
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

type BufferedStream = {
  server: Server;
  room: string;
  draftId: string;
  blockId: string;
  sessionId: string;
  partialValue: unknown;
};
