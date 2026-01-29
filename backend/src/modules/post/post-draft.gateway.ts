import { randomUUID } from 'crypto';
import {
  ConnectedSocket,
  MessageBody,
  OnGatewayConnection,
  OnGatewayDisconnect,
  OnGatewayInit,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
  WsException,
} from '@nestjs/websockets';
import { Logger, UseGuards } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import type { Server, Socket } from 'socket.io';
import { isUUID } from 'class-validator';

import { WsJwtGuard } from '@/modules/auth/ws/ws-jwt.guard';
import { PostDraft } from '@/modules/post/entity/post-draft.entity';
import { GroupMember } from '@/modules/group/entity/group_member.entity';
import { User } from '@/modules/user/entity/user.entity';
import { PresenceService } from './collab/presence.service';
import { LockService } from './collab/lock.service';
import { DraftStateService } from './collab/draft-state.service';
import { PatchStreamService } from './collab/patch-stream.service';
import { acquireLockWithEmit, emitLockExpired } from './collab/lock-events';
import type {
  DraftSocketData,
  JoinDraftPayload,
  LeaveDraftPayload,
  LockPayload,
  PresenceMember,
  PresenceHeartbeatPayload,
  PatchApplyPayload,
  StreamPayload,
} from './collab/types';

@WebSocketGateway({
  cors: {
    origin: process.env.FRONTEND_URL ?? true,
    credentials: true,
  },
})
@UseGuards(WsJwtGuard)
export class PostDraftGateway
  implements OnGatewayConnection, OnGatewayDisconnect, OnGatewayInit
{
  private readonly logger = new Logger(PostDraftGateway.name);
  private static readonly PRESENCE_TTL_MS = 60_000;
  private static readonly PRESENCE_SWEEP_MS = 10_000;
  private presenceSweepTimer?: NodeJS.Timeout;

  constructor(
    @InjectRepository(PostDraft)
    private readonly postDraftRepository: Repository<PostDraft>,
    @InjectRepository(GroupMember)
    private readonly groupMemberRepository: Repository<GroupMember>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly presenceService: PresenceService,
    private readonly lockService: LockService,
    private readonly draftStateService: DraftStateService,
    private readonly patchStreamService: PatchStreamService,
  ) {}

  @WebSocketServer()
  private readonly server: Server;

  afterInit() {
    if (this.presenceSweepTimer) {
      clearInterval(this.presenceSweepTimer);
    }
    this.presenceSweepTimer = setInterval(() => {
      this.sweepStalePresence();
    }, PostDraftGateway.PRESENCE_SWEEP_MS);
  }

  @SubscribeMessage('JOIN_DRAFT')
  async handleJoinDraft(
    @MessageBody() payload: JoinDraftPayload,
    @ConnectedSocket() socket: Socket,
  ) {
    this.logger.log(
      `JOIN_DRAFT payload=${JSON.stringify(payload)} user=${this.getSocketData(socket).user?.sub ?? 'unknown'}`,
    );
    const draftId = payload?.draftId;
    if (!draftId || !isUUID(draftId)) {
      throw new WsException('draftId must be a UUID.');
    }

    const sessionId = randomUUID();
    const actorId = this.resolveActorId(socket);
    const { displayName, role, profileImageId } = await this.resolveMemberInfo(
      actorId,
      draftId,
    );
    const member: PresenceMember = {
      sessionId,
      displayName,
      profileImageId,
      permissionRole: role,
      lastSeenAt: new Date().toISOString(),
    };

    this.leaveCurrentDraft(socket);

    const socketData = this.getSocketData(socket);
    socketData.sessionId = sessionId;
    socketData.actorId = actorId;
    socketData.displayName = displayName;
    socketData.role = role;
    socketData.draftId = draftId;
    this.presenceService.setSessionActor(sessionId, actorId);

    const room = this.getDraftRoom(draftId);
    void socket.join(room);

    const previous = this.presenceService.getMemberByActor(draftId, actorId);
    if (previous) {
      this.presenceService.markReplaced(draftId, previous.sessionId);
      this.releaseLocksForSessionId(draftId, previous.sessionId, true);
      this.notifySessionReplaced(actorId, socket.id);
      this.disconnectPreviousSession(actorId, socket.id);
      this.server.to(room).emit('PRESENCE_REPLACED', {
        previousSessionId: previous.sessionId,
        sessionId,
        displayName: member.displayName,
      });
    }
    this.presenceService.addMember(draftId, actorId, member);
    this.presenceService.setSocketId(actorId, socket.id);

    socket.emit('PRESENCE_SNAPSHOT', {
      sessionId,
      members: this.presenceService.getMembersArray(draftId),
      locks: this.lockService.getLocks(draftId),
      version: 0,
    });

    socket.to(room).emit('PRESENCE_JOINED', { member });
  }

  @SubscribeMessage('LOCK_ACQUIRE')
  handleLockAcquire(
    @MessageBody() payload: LockPayload,
    @ConnectedSocket() socket: Socket,
  ) {
    const { draftId, actorId, sessionId } = this.getRequiredSession(socket);
    this.ensureNotPublishing(draftId);
    const room = this.getDraftRoom(draftId);
    const lockKey = this.normalizeLockKey(payload?.lockKey);
    if (!lockKey) {
      throw new WsException('lockKey is invalid.');
    }

    const result = acquireLockWithEmit(
      this.lockService,
      this.server,
      room,
      socket,
      draftId,
      lockKey,
      actorId,
      sessionId,
    );
    if (!result.ok) {
      socket.emit('LOCK_DENIED', {
        lockKey,
        ownerSessionId: result.ownerSessionId,
      });
      return;
    }
  }

  @SubscribeMessage('LOCK_RELEASE')
  handleLockRelease(
    @MessageBody() payload: LockPayload,
    @ConnectedSocket() socket: Socket,
  ) {
    const { draftId, actorId, sessionId } = this.getRequiredSession(socket);
    const lockKey = this.normalizeLockKey(payload?.lockKey);
    if (!lockKey) {
      throw new WsException('lockKey is invalid.');
    }

    const result = this.lockService.releaseLock(
      draftId,
      lockKey,
      actorId,
      sessionId,
    );
    if (!result.ok) {
      socket.emit('LOCK_DENIED', {
        lockKey,
        ownerSessionId: result.ownerSessionId,
      });
      return;
    }
    this.server.to(this.getDraftRoom(draftId)).emit('LOCK_CHANGED', {
      lockKey,
      ownerSessionId: null,
    });
  }

  @SubscribeMessage('LOCK_HEARTBEAT')
  handleLockHeartbeat(
    @MessageBody() payload: LockPayload,
    @ConnectedSocket() socket: Socket,
  ) {
    const { draftId, actorId, sessionId } = this.getRequiredSession(socket);
    this.ensureNotPublishing(draftId);
    const room = this.getDraftRoom(draftId);
    const lockKey = this.normalizeLockKey(payload?.lockKey);
    if (!lockKey) {
      throw new WsException('lockKey is invalid.');
    }

    const result = this.lockService.heartbeat(
      draftId,
      lockKey,
      actorId,
      sessionId,
      (entry) =>
        emitLockExpired(this.server, room, entry.lockKey, entry.ownerSessionId),
    );
    if (!result.ok) {
      socket.emit('LOCK_DENIED', {
        lockKey,
        ownerSessionId: result.ownerSessionId,
      });
    }
    this.presenceService.updateLastSeenAt(draftId, sessionId);
  }

  @SubscribeMessage('BLOCK_VALUE_STREAM')
  handleBlockValueStream(
    @MessageBody() payload: StreamPayload,
    @ConnectedSocket() socket: Socket,
  ) {
    const { draftId, sessionId } = this.getRequiredSession(socket);
    const room = this.getDraftRoom(draftId);
    this.patchStreamService.handleBlockValueStream(
      this.server,
      socket,
      room,
      draftId,
      sessionId,
      payload,
    );
  }

  @SubscribeMessage('PATCH_APPLY')
  async handlePatchApply(
    @MessageBody() payload: PatchApplyPayload,
    @ConnectedSocket() socket: Socket,
  ) {
    const { draftId, actorId, sessionId } = this.getRequiredSession(socket);
    const room = this.getDraftRoom(draftId);
    await this.patchStreamService.handlePatchApply(
      this.server,
      socket,
      room,
      draftId,
      actorId,
      sessionId,
      payload,
    );
  }

  @SubscribeMessage('LEAVE_DRAFT')
  handleLeaveDraft(
    @MessageBody() payload: LeaveDraftPayload,
    @ConnectedSocket() socket: Socket,
  ) {
    const socketData = this.getSocketData(socket);
    if (payload?.draftId && payload.draftId !== socketData.draftId) {
      throw new WsException('draftId mismatch.');
    }
    this.leaveCurrentDraft(socket);
  }

  @SubscribeMessage('PRESENCE_HEARTBEAT')
  handlePresenceHeartbeat(
    @MessageBody() payload: PresenceHeartbeatPayload,
    @ConnectedSocket() socket: Socket,
  ) {
    const socketData = this.getSocketData(socket);
    if (payload?.draftId && payload.draftId !== socketData.draftId) {
      throw new WsException('draftId mismatch.');
    }
    if (!socketData.draftId || !socketData.sessionId) {
      throw new WsException('Session is not initialized.');
    }
    this.presenceService.updateLastSeenAt(
      socketData.draftId,
      socketData.sessionId,
    );
  }

  handleDisconnect(socket: Socket) {
    this.leaveCurrentDraft(socket);
  }

  handleConnection(socket: Socket) {
    this.logger.log(`WS_CONNECT socketId=${socket.id}`);
  }

  broadcastDraftPublished(draftId: string, postId: string) {
    this.server.to(this.getDraftRoom(draftId)).emit('DRAFT_PUBLISHED', {
      postId,
    });
  }

  broadcastDraftPublishStarted(draftId: string) {
    this.server.to(this.getDraftRoom(draftId)).emit('DRAFT_PUBLISH_STARTED', {
      draftId,
    });
  }

  private getDraftRoom(draftId: string) {
    return `draft:${draftId}`;
  }

  private leaveCurrentDraft(socket: Socket) {
    const socketData = this.getSocketData(socket);
    const draftId = socketData.draftId;
    const sessionId = socketData.sessionId;
    if (!draftId || !sessionId) return;

    this.releaseLocksForSessionId(draftId, sessionId, true);

    const isReplaced = this.presenceService.isReplaced(draftId, sessionId);
    const removed = isReplaced
      ? { member: null, actorId: null }
      : this.presenceService.removeMemberBySession(draftId, sessionId);

    void socket.leave(this.getDraftRoom(draftId));
    this.presenceService.clearReplaced(draftId, sessionId);
    if (removed.member && !isReplaced) {
      this.server.to(this.getDraftRoom(draftId)).emit('PRESENCE_LEFT', {
        sessionId,
      });
    }
    socketData.draftId = undefined;
    this.presenceService.clearSessionActor(sessionId);
    if (socketData.actorId) {
      this.presenceService.clearSocketIdIfMatch(socketData.actorId, socket.id);
    }
  }

  private sweepStalePresence() {
    const draftIds = this.presenceService.getDraftIds();
    draftIds.forEach((draftId) => {
      const staleSessions = this.presenceService.getStaleSessionIds(
        draftId,
        PostDraftGateway.PRESENCE_TTL_MS,
      );
      staleSessions.forEach((sessionId) => {
        this.evictStaleSession(draftId, sessionId);
      });
    });
  }

  private evictStaleSession(draftId: string, sessionId: string) {
    const actorId = this.presenceService.getActorIdBySession(sessionId);
    if (!actorId) return;
    const socketId = this.presenceService.getSocketId(actorId);
    if (socketId) {
      const socket = this.server.sockets.sockets.get(socketId);
      if (socket) {
        this.leaveCurrentDraft(socket);
        return;
      }
      this.presenceService.clearSocketIdIfMatch(actorId, socketId);
    }

    this.releaseLocksForSessionId(draftId, sessionId, true);
    const removed = this.presenceService.removeMemberBySession(
      draftId,
      sessionId,
    );
    this.presenceService.clearReplaced(draftId, sessionId);
    this.presenceService.clearSessionActor(sessionId);
    if (removed.member) {
      this.server.to(this.getDraftRoom(draftId)).emit('PRESENCE_LEFT', {
        sessionId,
      });
    }
  }

  private resolveActorId(socket: Socket) {
    const socketData = this.getSocketData(socket);
    const actorId = socketData.user?.sub;
    if (!actorId || !isUUID(actorId)) {
      throw new WsException('actorId is invalid.');
    }
    return actorId;
  }

  private async resolveMemberInfo(actorId: string, draftId: string) {
    const draft = await this.postDraftRepository.findOne({
      where: { id: draftId, isActive: true },
      select: { id: true, groupId: true },
    });
    if (!draft) {
      throw new WsException('Draft not found.');
    }

    const member = await this.groupMemberRepository.findOne({
      where: { groupId: draft.groupId, userId: actorId },
      select: { role: true, nicknameInGroup: true },
    });
    const user = await this.userRepository.findOne({
      where: { id: actorId },
      select: { nickname: true, profileImageId: true },
    });
    if (!user) {
      throw new WsException('User not found.');
    }

    const displayName = member?.nicknameInGroup ?? user.nickname ?? 'User';
    const profileImageId = user.profileImageId ?? null;
    if (!member) {
      throw new WsException('Group membership is required.');
    }

    return {
      displayName,
      role: member.role,
      profileImageId,
    };
  }

  private getSocketData(socket: Socket): DraftSocketData {
    return socket.data as DraftSocketData;
  }

  private normalizeLockKey(lockKey?: string) {
    if (!lockKey) return null;
    const match = /^(block|table):(title|[0-9a-fA-F-]{36})$/.exec(lockKey);
    if (!match) return null;
    const blockId = match[2];
    if (blockId !== 'title' && !isUUID(blockId)) return null;
    if (blockId === 'title' && match[1] !== 'block') return null;
    // TODO: Validate that the blockId exists in the draft when PATCH/STREAM is implemented.
    return `${match[1]}:${blockId}`;
  }

  private getRequiredSession(socket: Socket) {
    const socketData = this.getSocketData(socket);
    const draftId = socketData.draftId;
    const sessionId = socketData.sessionId;
    const actorId = socketData.actorId;
    if (!draftId || !sessionId || !actorId) {
      throw new WsException('Session is not initialized.');
    }
    return { draftId, sessionId, actorId };
  }

  private releaseLocksForSessionId(
    draftId: string,
    sessionId: string,
    emitStreamAbort: boolean,
  ) {
    this.lockService.releaseLocksForSessionId(draftId, sessionId, (lockKey) => {
      if (emitStreamAbort && lockKey.startsWith('block:')) {
        const blockId = lockKey.slice('block:'.length);
        this.server.to(this.getDraftRoom(draftId)).emit('STREAM_ABORTED', {
          blockId,
          sessionId,
        });
      }
      this.server.to(this.getDraftRoom(draftId)).emit('LOCK_CHANGED', {
        lockKey,
        ownerSessionId: null,
      });
    });
  }

  private disconnectPreviousSession(actorId: string, currentSocketId: string) {
    const previousSocketId = this.presenceService.getSocketId(actorId);
    if (!previousSocketId || previousSocketId === currentSocketId) return;
    const previousSocket = this.server.sockets.sockets.get(previousSocketId);
    previousSocket?.disconnect(true);
  }

  private notifySessionReplaced(actorId: string, currentSocketId: string) {
    const previousSocketId = this.presenceService.getSocketId(actorId);
    if (!previousSocketId || previousSocketId === currentSocketId) return;
    const previousSocket = this.server.sockets.sockets.get(previousSocketId);
    // TODO: Include device info (user agent / deviceId) in SESSION_REPLACED payload.
    previousSocket?.emit('SESSION_REPLACED', {});
  }

  private ensureNotPublishing(draftId: string) {
    if (this.draftStateService.isPublishing(draftId)) {
      throw new WsException('Draft is publishing.');
    }
  }
}
