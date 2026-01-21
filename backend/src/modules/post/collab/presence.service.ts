import { Injectable } from '@nestjs/common';
import type { PresenceMember } from './types';

@Injectable()
export class PresenceService {
  private readonly presenceByDraft = new Map<
    string,
    Map<string, PresenceMember>
  >();
  private readonly replacedSessionsByDraft = new Map<string, Set<string>>();
  private readonly sessionActorMap = new Map<string, string>();
  private readonly socketIdByActor = new Map<string, string>();

  getMembersMap(draftId: string) {
    const existing = this.presenceByDraft.get(draftId);
    if (existing) return existing;
    const created = new Map<string, PresenceMember>();
    this.presenceByDraft.set(draftId, created);
    return created;
  }

  getMembersArray(draftId: string) {
    const members = this.presenceByDraft.get(draftId);
    return members ? Array.from(members.values()) : [];
  }

  getMemberByActor(draftId: string, actorId: string) {
    return this.presenceByDraft.get(draftId)?.get(actorId) ?? null;
  }

  addMember(draftId: string, actorId: string, member: PresenceMember) {
    this.getMembersMap(draftId).set(actorId, member);
  }

  removeMemberBySession(draftId: string, sessionId: string) {
    const actorId = this.sessionActorMap.get(sessionId);
    if (!actorId) return { member: null, actorId: null };
    const members = this.presenceByDraft.get(draftId);
    const member = members?.get(actorId) ?? null;
    if (member) {
      members?.delete(actorId);
      if (members && members.size === 0) {
        this.presenceByDraft.delete(draftId);
      }
    }
    return { member, actorId };
  }

  markReplaced(draftId: string, sessionId: string) {
    const existing = this.replacedSessionsByDraft.get(draftId);
    if (existing) {
      existing.add(sessionId);
      return;
    }
    this.replacedSessionsByDraft.set(draftId, new Set([sessionId]));
  }

  isReplaced(draftId: string, sessionId: string) {
    return this.replacedSessionsByDraft.get(draftId)?.has(sessionId) ?? false;
  }

  clearReplaced(draftId: string, sessionId: string) {
    const existing = this.replacedSessionsByDraft.get(draftId);
    if (!existing) return;
    existing.delete(sessionId);
    if (existing.size === 0) {
      this.replacedSessionsByDraft.delete(draftId);
    }
  }

  setSessionActor(sessionId: string, actorId: string) {
    this.sessionActorMap.set(sessionId, actorId);
  }

  getActorIdBySession(sessionId: string) {
    return this.sessionActorMap.get(sessionId) ?? null;
  }

  clearSessionActor(sessionId: string) {
    this.sessionActorMap.delete(sessionId);
  }

  setSocketId(actorId: string, socketId: string) {
    this.socketIdByActor.set(actorId, socketId);
  }

  getSocketId(actorId: string) {
    return this.socketIdByActor.get(actorId) ?? null;
  }

  clearSocketIdIfMatch(actorId: string, socketId: string) {
    if (this.socketIdByActor.get(actorId) === socketId) {
      this.socketIdByActor.delete(actorId);
    }
  }
}
