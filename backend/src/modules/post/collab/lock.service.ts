import { Injectable } from '@nestjs/common';
import type { LockEntry } from './types';

@Injectable()
export class LockService {
  private readonly locksByDraft = new Map<string, Map<string, LockEntry>>();
  private readonly locksBySession = new Map<string, Set<string>>();

  private static readonly LOCK_TTL_MS = 30_000;

  getLocks(draftId: string) {
    const locks = this.locksByDraft.get(draftId);
    if (!locks) return [];
    return Array.from(locks.values())
      .filter((lock) => lock.expiresAt > Date.now())
      .map((lock) => ({
        lockKey: lock.lockKey,
        ownerSessionId: lock.ownerSessionId,
      }));
  }

  getActiveLockOwnerSessionId(draftId: string, lockKey: string) {
    const locks = this.locksByDraft.get(draftId);
    if (!locks) return null;
    const existing = locks.get(lockKey);
    if (!existing) return null;
    if (existing.expiresAt <= Date.now()) return null;
    return existing.ownerSessionId;
  }

  acquireLock(
    draftId: string,
    lockKey: string,
    ownerActorId: string,
    ownerSessionId: string,
    onExpire: (entry: LockEntry) => void,
  ) {
    const locks = this.getOrCreateDraftLocks(draftId);
    const existing = locks.get(lockKey);
    if (existing && existing.expiresAt > Date.now()) {
      return { ok: false, ownerSessionId: existing.ownerSessionId };
    }

    if (existing) {
      this.clearLockTimeout(existing);
      locks.delete(lockKey);
    }

    const timeoutId = setTimeout(() => {
      const entry = locks.get(lockKey);
      if (!entry) return;
      locks.delete(lockKey);
      this.removeSessionLock(entry.ownerSessionId, lockKey);
      onExpire(entry);
    }, LockService.LOCK_TTL_MS);

    const entry: LockEntry = {
      lockKey,
      ownerActorId,
      ownerSessionId,
      expiresAt: Date.now() + LockService.LOCK_TTL_MS,
      timeoutId,
    };
    locks.set(lockKey, entry);
    this.addSessionLock(ownerSessionId, lockKey);

    return { ok: true, ownerSessionId };
  }

  releaseLock(
    draftId: string,
    lockKey: string,
    ownerActorId: string,
    ownerSessionId: string,
  ) {
    const locks = this.getOrCreateDraftLocks(draftId);
    const existing = locks.get(lockKey);
    if (!existing) return { ok: true };
    if (
      existing.ownerActorId !== ownerActorId ||
      existing.ownerSessionId !== ownerSessionId
    ) {
      return { ok: false, ownerSessionId: existing.ownerSessionId };
    }

    this.clearLockTimeout(existing);
    locks.delete(lockKey);
    this.removeSessionLock(ownerSessionId, lockKey);
    return { ok: true };
  }

  heartbeat(
    draftId: string,
    lockKey: string,
    ownerActorId: string,
    ownerSessionId: string,
    onExpire: (entry: LockEntry) => void,
  ) {
    const locks = this.getOrCreateDraftLocks(draftId);
    const existing = locks.get(lockKey);
    if (!existing) {
      return { ok: false, ownerSessionId: null };
    }
    if (
      existing.ownerActorId !== ownerActorId ||
      existing.ownerSessionId !== ownerSessionId
    ) {
      return { ok: false, ownerSessionId: existing.ownerSessionId };
    }

    this.clearLockTimeout(existing);
    existing.expiresAt = Date.now() + LockService.LOCK_TTL_MS;
    existing.timeoutId = setTimeout(() => {
      const entry = locks.get(lockKey);
      if (!entry) return;
      locks.delete(lockKey);
      this.removeSessionLock(entry.ownerSessionId, lockKey);
      onExpire(entry);
    }, LockService.LOCK_TTL_MS);

    return { ok: true, ownerSessionId };
  }

  releaseLocksForSession(
    draftId: string,
    sessionId: string,
    onRelease: (lockKey: string) => void,
  ) {
    const locks = this.locksByDraft.get(draftId);
    const sessionLocks = this.locksBySession.get(sessionId);
    if (!locks || !sessionLocks) return;

    sessionLocks.forEach((lockKey) => {
      const existing = locks.get(lockKey);
      if (!existing) return;
      if (existing.ownerSessionId !== sessionId) return;
      this.clearLockTimeout(existing);
      locks.delete(lockKey);
      onRelease(lockKey);
    });

    this.locksBySession.delete(sessionId);
    if (locks.size === 0) {
      this.locksByDraft.delete(draftId);
    }
  }

  releaseLocksForSessionId(
    draftId: string,
    sessionId: string,
    onRelease: (lockKey: string) => void,
  ) {
    this.releaseLocksForSession(draftId, sessionId, onRelease);
  }

  private getOrCreateDraftLocks(draftId: string) {
    const existing = this.locksByDraft.get(draftId);
    if (existing) return existing;
    const created = new Map<string, LockEntry>();
    this.locksByDraft.set(draftId, created);
    return created;
  }

  private clearLockTimeout(lock: LockEntry) {
    clearTimeout(lock.timeoutId);
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
}
