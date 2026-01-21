import { randomUUID } from 'crypto';
import {
  ConnectedSocket,
  MessageBody,
  OnGatewayDisconnect,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
  WsException,
} from '@nestjs/websockets';
import { UseGuards } from '@nestjs/common';
import type { Server, Socket } from 'socket.io';
import { isUUID } from 'class-validator';

import { WsJwtGuard } from '@/modules/auth/ws/ws-jwt.guard';
import type { MyJwtPayload } from '@/modules/auth/auth.type';

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
export class PostDraftGateway implements OnGatewayDisconnect {
  @WebSocketServer()
  private readonly server: Server;

  private readonly presenceByDraft = new Map<
    string,
    Map<string, PresenceMember>
  >();

  @SubscribeMessage('JOIN_DRAFT')
  handleJoinDraft(
    @MessageBody() payload: JoinDraftPayload,
    @ConnectedSocket() socket: Socket,
  ) {
    const draftId = payload?.draftId;
    if (!draftId || !isUUID(draftId)) {
      throw new WsException('draftId must be a UUID.');
    }

    const sessionId = randomUUID();
    const { actorId, displayName, role } = this.resolveIdentity(socket);
    const member: PresenceMember = {
      actorId,
      sessionId,
      displayName,
      role,
      lastSeenAt: new Date().toISOString(),
    };

    this.leaveCurrentDraft(socket);

    const data = this.getSocketData(socket);
    data.sessionId = sessionId;
    data.actorId = actorId;
    data.displayName = displayName;
    data.role = role;
    data.draftId = draftId;

    const room = this.getDraftRoom(draftId);
    void socket.join(room);

    const membersMap = this.getOrCreateDraftMembers(draftId);
    const previous = membersMap.get(actorId);
    if (previous) {
      this.server.to(room).emit('PRESENCE_LEFT', {
        sessionId: previous.sessionId,
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

  private leaveCurrentDraft(socket: Socket) {
    const data = this.getSocketData(socket);
    const draftId = data.draftId;
    const sessionId = data.sessionId;
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
    if (member) {
      this.server.to(this.getDraftRoom(draftId)).emit('PRESENCE_LEFT', {
        sessionId,
        actorId: member.actorId,
      });
    }
    const data = this.getSocketData(socket);
    data.draftId = undefined;
  }

  private resolveIdentity(socket: Socket) {
    const auth = (socket.handshake.auth ?? {}) as {
      displayName?: string;
      role?: string;
    };
    const data = this.getSocketData(socket);
    const actorId = data.user?.sub;
    if (!actorId || !isUUID(actorId)) {
      throw new WsException('actorId is invalid.');
    }
    return {
      actorId,
      displayName: auth.displayName ?? 'User',
      role: auth.role ?? 'EDITOR',
    };
  }

  private getSocketData(socket: Socket): DraftSocketData {
    return socket.data as DraftSocketData;
  }
}
