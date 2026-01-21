import { randomUUID } from 'crypto';
import {
  ConnectedSocket,
  MessageBody,
  OnGatewayConnection,
  OnGatewayDisconnect,
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
import type { MyJwtPayload } from '@/modules/auth/auth.type';
import { PostDraft } from '@/modules/post/entity/post-draft.entity';
import { GroupMember } from '@/modules/group/entity/group_member.entity';
import { User } from '@/modules/user/user.entity';

type PresenceMember = {
  sessionId: string;
  displayName: string;
  profileImageId: string | null;
  permissionRole: string;
  lastSeenAt: string;
};

type LockEntry = {
  lockKey: string;
  ownerActorId: string;
  ownerSessionId: string;
  expiresAt: number;
  timeoutId: NodeJS.Timeout;
};

type JoinDraftPayload = {
  draftId: string;
};

type LockPayload = {
  lockKey: string;
};

type DraftSocketData = {
  user?: MyJwtPayload;
  sessionId?: string;
  actorId?: string;
  displayName?: string;
  role?: string;
  draftId?: string;
};

@WebSocketGateway({
  cors: {
    origin: process.env.FRONTEND_URL ?? true,
    credentials: true,
  },
})
@UseGuards(WsJwtGuard)
export class PostDraftGateway
  implements OnGatewayConnection, OnGatewayDisconnect
{
  private readonly logger = new Logger(PostDraftGateway.name);

  constructor(
    @InjectRepository(PostDraft)
    private readonly postDraftRepository: Repository<PostDraft>,
    @InjectRepository(GroupMember)
    private readonly groupMemberRepository: Repository<GroupMember>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  @WebSocketServer()
  private readonly server: Server;

  private readonly presenceByDraft = new Map<
    string,
    Map<string, PresenceMember>
  >();
  private readonly sessionActorMap = new Map<string, string>();
  private readonly replacedSessionsByDraft = new Map<string, Set<string>>();
  private readonly locksByDraft = new Map<string, Map<string, LockEntry>>();
  private readonly locksBySession = new Map<string, Set<string>>();
  private readonly socketIdByActor = new Map<string, string>();

  private static readonly LOCK_TTL_MS = 30_000;

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
    this.sessionActorMap.set(sessionId, actorId);

    const room = this.getDraftRoom(draftId);
    void socket.join(room);

    const membersMap = this.getOrCreateDraftMembers(draftId);
    const previous = membersMap.get(actorId);
    if (previous) {
      this.getOrCreateReplacedSessions(draftId).add(previous.sessionId);
      this.releaseLocksForSessionId(draftId, previous.sessionId);
      this.notifySessionReplaced(actorId, socket.id);
      this.disconnectPreviousSession(actorId, socket.id);
      this.server.to(room).emit('PRESENCE_REPLACED', {
        previousSessionId: previous.sessionId,
        sessionId,
        displayName: member.displayName,
      });
    }
    membersMap.set(actorId, member);
    this.socketIdByActor.set(actorId, socket.id);

    socket.emit('PRESENCE_SNAPSHOT', {
      sessionId,
      members: Array.from(membersMap.values()),
      locks: this.listLocks(draftId),
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
    const lockKey = this.normalizeLockKey(payload?.lockKey);
    if (!lockKey) {
      throw new WsException('lockKey is invalid.');
    }

    const locks = this.getOrCreateDraftLocks(draftId);
    const existing = locks.get(lockKey);
    if (existing && existing.expiresAt > Date.now()) {
      socket.emit('LOCK_DENIED', {
        lockKey,
        ownerSessionId: existing.ownerSessionId,
      });
      return;
    }

    if (existing) {
      this.clearLockTimeout(existing);
      locks.delete(lockKey);
    }

    const timeoutId = setTimeout(() => {
      this.expireLock(draftId, lockKey);
    }, PostDraftGateway.LOCK_TTL_MS);

    const entry: LockEntry = {
      lockKey,
      ownerActorId: actorId,
      ownerSessionId: sessionId,
      expiresAt: Date.now() + PostDraftGateway.LOCK_TTL_MS,
      timeoutId,
    };
    locks.set(lockKey, entry);
    this.addSessionLock(sessionId, lockKey);

    socket.emit('LOCK_GRANTED', { lockKey, ownerSessionId: sessionId });
    this.server.to(this.getDraftRoom(draftId)).emit('LOCK_CHANGED', {
      lockKey,
      ownerSessionId: sessionId,
    });
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

    const locks = this.getOrCreateDraftLocks(draftId);
    const existing = locks.get(lockKey);
    if (!existing) return;
    if (
      existing.ownerActorId !== actorId ||
      existing.ownerSessionId !== sessionId
    ) {
      socket.emit('LOCK_DENIED', {
        lockKey,
        ownerSessionId: existing.ownerSessionId,
      });
      return;
    }

    this.clearLockTimeout(existing);
    locks.delete(lockKey);
    this.removeSessionLock(sessionId, lockKey);
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
    const lockKey = this.normalizeLockKey(payload?.lockKey);
    if (!lockKey) {
      throw new WsException('lockKey is invalid.');
    }

    const locks = this.getOrCreateDraftLocks(draftId);
    const existing = locks.get(lockKey);
    if (!existing) {
      socket.emit('LOCK_DENIED', { lockKey, ownerSessionId: null });
      return;
    }
    if (
      existing.ownerActorId !== actorId ||
      existing.ownerSessionId !== sessionId
    ) {
      socket.emit('LOCK_DENIED', {
        lockKey,
        ownerSessionId: existing.ownerSessionId,
      });
      return;
    }

    this.clearLockTimeout(existing);
    existing.expiresAt = Date.now() + PostDraftGateway.LOCK_TTL_MS;
    existing.timeoutId = setTimeout(() => {
      this.expireLock(draftId, lockKey);
    }, PostDraftGateway.LOCK_TTL_MS);
  }

  handleDisconnect(socket: Socket) {
    this.leaveCurrentDraft(socket);
  }

  handleConnection(socket: Socket) {
    this.logger.log(`WS_CONNECT socketId=${socket.id}`);
  }

  private getDraftRoom(draftId: string) {
    return `draft:${draftId}`;
  }

  private getOrCreateDraftMembers(draftId: string) {
    const existing = this.presenceByDraft.get(draftId);
    if (existing) return existing;
    const created = new Map<string, PresenceMember>();
    this.presenceByDraft.set(draftId, created);
    return created;
  }

  private getOrCreateReplacedSessions(draftId: string) {
    const existing = this.replacedSessionsByDraft.get(draftId);
    if (existing) return existing;
    const created = new Set<string>();
    this.replacedSessionsByDraft.set(draftId, created);
    return created;
  }

  private leaveCurrentDraft(socket: Socket) {
    this.releaseLocksForSession(socket);
    const socketData = this.getSocketData(socket);
    const draftId = socketData.draftId;
    const sessionId = socketData.sessionId;
    if (!draftId || !sessionId) return;

    const membersMap = this.presenceByDraft.get(draftId);
    const replacedSessions = this.replacedSessionsByDraft.get(draftId);
    const isReplaced = replacedSessions?.has(sessionId) ?? false;
    const member = Array.from(membersMap?.values() ?? []).find(
      (value) => value.sessionId === sessionId,
    );
    if (member && !isReplaced) {
      const actorId = this.sessionActorMap.get(sessionId);
      if (actorId) {
        membersMap?.delete(actorId);
      }
    }
    if (membersMap && membersMap.size === 0) {
      this.presenceByDraft.delete(draftId);
    }

    void socket.leave(this.getDraftRoom(draftId));
    if (replacedSessions?.size) {
      replacedSessions.delete(sessionId);
      if (replacedSessions.size === 0) {
        this.replacedSessionsByDraft.delete(draftId);
      }
    }
    if (member && !isReplaced) {
      this.server.to(this.getDraftRoom(draftId)).emit('PRESENCE_LEFT', {
        sessionId,
      });
    }
    socketData.draftId = undefined;
    this.sessionActorMap.delete(sessionId);
    if (
      socketData.actorId &&
      this.socketIdByActor.get(socketData.actorId) === socket.id
    ) {
      this.socketIdByActor.delete(socketData.actorId);
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
      // TODO: Remove this bypass after invite/guest access rules are finalized.
      // TODO: Enforce group membership or contributor role (>= EDITOR) before allowing join.
      return {
        displayName,
        role: 'EDITOR',
        profileImageId,
      };
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
    const match = /^(block|table):([0-9a-fA-F-]{36})$/.exec(lockKey);
    if (!match) return null;
    const blockId = match[2];
    if (!isUUID(blockId)) return null;
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

  private getOrCreateDraftLocks(draftId: string) {
    const existing = this.locksByDraft.get(draftId);
    if (existing) return existing;
    const created = new Map<string, LockEntry>();
    this.locksByDraft.set(draftId, created);
    return created;
  }

  private listLocks(draftId: string) {
    const locks = this.locksByDraft.get(draftId);
    if (!locks) return [];
    return Array.from(locks.values())
      .filter((lock) => lock.expiresAt > Date.now())
      .map((lock) => ({
        lockKey: lock.lockKey,
        ownerSessionId: lock.ownerSessionId,
      }));
  }

  private clearLockTimeout(lock: LockEntry) {
    clearTimeout(lock.timeoutId);
  }

  private expireLock(draftId: string, lockKey: string) {
    const locks = this.locksByDraft.get(draftId);
    if (!locks) return;
    const existing = locks.get(lockKey);
    if (!existing) return;
    locks.delete(lockKey);
    this.removeSessionLock(existing.ownerSessionId, lockKey);
    this.server.to(this.getDraftRoom(draftId)).emit('LOCK_EXPIRED', {
      lockKey,
      ownerSessionId: existing.ownerSessionId,
    });
    this.server.to(this.getDraftRoom(draftId)).emit('LOCK_CHANGED', {
      lockKey,
      ownerSessionId: null,
    });
  }

  private addSessionLock(sessionId: string, lockKey: string) {
    const existing = this.locksBySession.get(sessionId);
    if (existing) {
      existing.add(lockKey);
      return;
    }
    this.locksBySession.set(sessionId, new Set([lockKey]));
  }

  private removeSessionLock(sessionId: string, lockKey: string) {
    const existing = this.locksBySession.get(sessionId);
    if (!existing) return;
    existing.delete(lockKey);
    if (existing.size === 0) {
      this.locksBySession.delete(sessionId);
    }
  }

  private releaseLocksForSession(socket: Socket) {
    const socketData = this.getSocketData(socket);
    const draftId = socketData.draftId;
    const sessionId = socketData.sessionId;
    if (!draftId || !sessionId) return;
    this.releaseLocksForSessionId(draftId, sessionId);
  }

  private releaseLocksForSessionId(draftId: string, sessionId: string) {
    const locks = this.locksByDraft.get(draftId);
    const sessionLocks = this.locksBySession.get(sessionId);
    if (!locks || !sessionLocks) return;

    sessionLocks.forEach((lockKey) => {
      const existing = locks.get(lockKey);
      if (!existing) return;
      if (existing.ownerSessionId !== sessionId) return;
      this.clearLockTimeout(existing);
      locks.delete(lockKey);
      this.server.to(this.getDraftRoom(draftId)).emit('LOCK_CHANGED', {
        lockKey,
        ownerSessionId: null,
      });
    });

    this.locksBySession.delete(sessionId);
    if (locks.size === 0) {
      this.locksByDraft.delete(draftId);
    }
  }

  private disconnectPreviousSession(actorId: string, currentSocketId: string) {
    const previousSocketId = this.socketIdByActor.get(actorId);
    if (!previousSocketId || previousSocketId === currentSocketId) return;
    const previousSocket = this.server.sockets.sockets.get(previousSocketId);
    previousSocket?.disconnect(true);
  }

  private notifySessionReplaced(actorId: string, currentSocketId: string) {
    const previousSocketId = this.socketIdByActor.get(actorId);
    if (!previousSocketId || previousSocketId === currentSocketId) return;
    const previousSocket = this.server.sockets.sockets.get(previousSocketId);
    // TODO: Include device info (user agent / deviceId) in SESSION_REPLACED payload.
    previousSocket?.emit('SESSION_REPLACED', {});
  }
}
