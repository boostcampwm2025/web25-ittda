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
  actorId: string;
  sessionId: string;
  displayName: string;
  role: string;
  lastSeenAt: string;
};

type JoinDraftPayload = {
  draftId: string;
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
  private readonly replacedSessionsByDraft = new Map<string, Set<string>>();

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
    const { displayName, role } = await this.resolveMemberInfo(
      actorId,
      draftId,
    );
    const member: PresenceMember = {
      actorId,
      sessionId,
      displayName,
      role,
      lastSeenAt: new Date().toISOString(),
    };

    this.leaveCurrentDraft(socket);

    const socketData = this.getSocketData(socket);
    socketData.sessionId = sessionId;
    socketData.actorId = actorId;
    socketData.displayName = displayName;
    socketData.role = role;
    socketData.draftId = draftId;

    const room = this.getDraftRoom(draftId);
    void socket.join(room);

    const membersMap = this.getOrCreateDraftMembers(draftId);
    const previous = membersMap.get(actorId);
    if (previous) {
      this.getOrCreateReplacedSessions(draftId).add(previous.sessionId);
      this.server.to(room).emit('PRESENCE_REPLACED', {
        previousSessionId: previous.sessionId,
        sessionId,
        actorId,
      });
    }
    membersMap.set(actorId, member);

    socket.emit('PRESENCE_SNAPSHOT', {
      sessionId,
      members: Array.from(membersMap.values()),
      version: 0,
    });

    socket.to(room).emit('PRESENCE_JOINED', { member });
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
    const socketData = this.getSocketData(socket);
    const draftId = socketData.draftId;
    const sessionId = socketData.sessionId;
    if (!draftId || !sessionId) return;

    const membersMap = this.presenceByDraft.get(draftId);
    const member = Array.from(membersMap?.values() ?? []).find(
      (value) => value.sessionId === sessionId,
    );
    if (member) {
      membersMap?.delete(member.actorId);
    }
    if (membersMap && membersMap.size === 0) {
      this.presenceByDraft.delete(draftId);
    }

    void socket.leave(this.getDraftRoom(draftId));
    const replacedSessions = this.replacedSessionsByDraft.get(draftId);
    const isReplaced = replacedSessions?.has(sessionId) ?? false;
    if (replacedSessions?.size) {
      replacedSessions.delete(sessionId);
      if (replacedSessions.size === 0) {
        this.replacedSessionsByDraft.delete(draftId);
      }
    }
    if (member && !isReplaced) {
      this.server.to(this.getDraftRoom(draftId)).emit('PRESENCE_LEFT', {
        sessionId,
        actorId: member.actorId,
      });
    }
    socketData.draftId = undefined;
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
    if (!member) {
      throw new WsException('Not a group member.');
    }

    let displayName = member.nicknameInGroup ?? null;
    if (!displayName) {
      const user = await this.userRepository.findOne({
        where: { id: actorId },
        select: { nickname: true },
      });
      displayName = user?.nickname ?? 'User';
    }

    return {
      displayName,
      role: member.role,
    };
  }

  private getSocketData(socket: Socket): DraftSocketData {
    return socket.data as DraftSocketData;
  }
}
