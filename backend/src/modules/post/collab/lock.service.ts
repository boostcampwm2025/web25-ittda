import { Injectable, Logger } from '@nestjs/common';
import { RedisService } from '@liaoliaots/nestjs-redis';
import type { Redis } from 'ioredis';
import type { LockEntry, LockEntryPayload } from './types';

@Injectable()
export class LockService {
  private readonly logger = new Logger(LockService.name);

  // Legacy in-memory storage refactoring note:
  // - locksByDraft -> Redis SET "lock:{draftId}:{lockKey}"
  // - locksBySession -> Redis SET "session_locks:{sessionId}"
  // - timeoutId -> Redis PX (TTL)

  private static readonly LOCK_TTL_MS = 30_000;
  private static readonly LOCK_PREFIX = 'lock:';
  private static readonly DRAFT_LOCKS_PREFIX = 'draft_locks:';
  private static readonly SESSION_LOCKS_PREFIX = 'session_locks:';

  private readonly redis: Redis;

  constructor(private readonly redisService: RedisService) {
    this.redis = this.redisService.getOrThrow();
    // Redis가 제대로 설정되지 않았으면 애플리케이션 시작 시점에 에러 발생
    // 500 에러: ClientNotFoundError 에러를 발생
  }

  /**
   * Get all active locks for a draft
   * Redis Strategy: SMEMBERS draft_locks:{draftId} -> MGET lock keys
   */
  async getLocks(draftId: string) {
    // const locks = this.locksByDraft.get(draftId);
    // if (!locks) return [];
    // return Array.from(locks.values())
    //   .filter((lock) => lock.expiresAt > Date.now())
    //   .map((lock) => ({
    //     lockKey: lock.lockKey,
    //     ownerSessionId: lock.ownerSessionId,
    //   }));

    const indexKey = `${LockService.DRAFT_LOCKS_PREFIX}${draftId}`;
    const lockKeys = await this.redis.smembers(indexKey);

    if (lockKeys.length === 0) return [];

    // lockKeys are just "block:123". We need full keys "lock:draftId:block:123"
    const fullKeys = lockKeys.map(
      (key) => `${LockService.LOCK_PREFIX}${draftId}:${key}`,
    );

    const values = await this.redis.mget(fullKeys);

    return values
      .map((val, idx) => {
        if (!val) return null;
        try {
          // Redis stores LockEntryPayload (without timeoutId)
          const parsed = JSON.parse(val) as LockEntryPayload;
          return {
            lockKey: lockKeys[idx], // original key
            ownerSessionId: parsed.ownerSessionId,
          };
        } catch (e: unknown) {
          if (e instanceof Error) {
            this.logger.error(`Failed to parse lock entry: ${e.message}`);
          } else {
            this.logger.error(`Failed to parse lock entry: ${String(e)}`);
          }
          return null;
        }
      })
      .filter(
        (v): v is { lockKey: string; ownerSessionId: string } => v !== null,
      );
  }

  /**
   * Check if a specific lock is active
   */
  async getActiveLockOwnerSessionId(draftId: string, lockKey: string) {
    // const locks = this.locksByDraft.get(draftId);
    // if (!locks) return null;
    // const existing = locks.get(lockKey);
    // if (!existing) return null;
    // if (existing.expiresAt <= Date.now()) return null;
    // return existing.ownerSessionId;

    const redisKey = `${LockService.LOCK_PREFIX}${draftId}:${lockKey}`;
    const val = await this.redis.get(redisKey);
    if (!val) return null;

    try {
      const parsed = JSON.parse(val) as LockEntryPayload;
      return parsed.ownerSessionId;
    } catch {
      return null;
    }
  }

  /**
   * Acquire a lock
   * Redis Strategy: SET lock:{draftId}:{lockKey} {payload} NX PX 30000
   */
  async acquireLock(
    draftId: string,
    lockKey: string,
    ownerActorId: string,
    ownerSessionId: string,
    onExpire: (entry: LockEntry) => void,
  ) {
    // const locks = this.getOrCreateDraftLocks(draftId);
    // const existing = locks.get(lockKey);
    // ... (memory logic)

    const redisKey = `${LockService.LOCK_PREFIX}${draftId}:${lockKey}`;
    const indexKey = `${LockService.DRAFT_LOCKS_PREFIX}${draftId}`;
    const sessionIndexKey = `${LockService.SESSION_LOCKS_PREFIX}${ownerSessionId}`;

    const lockPayload: LockEntryPayload = {
      lockKey,
      ownerActorId,
      ownerSessionId,
      expiresAt: Date.now() + LockService.LOCK_TTL_MS,
    };

    // 1. Try to set specific lock key with NX (Only if Not Exists)
    const result = await this.redis.set(
      redisKey,
      JSON.stringify(lockPayload),
      'PX',
      LockService.LOCK_TTL_MS,
      'NX',
    );

    if (result !== 'OK') {
      // Failed to acquire. Check who owns it.
      const currentVal = await this.redis.get(redisKey);
      if (currentVal) {
        try {
          const owner = JSON.parse(currentVal) as LockEntryPayload;
          return { ok: false, ownerSessionId: owner.ownerSessionId };
        } catch {
          return { ok: false, ownerSessionId: null };
        }
      }
      return { ok: false, ownerSessionId: null };
    }

    // 2. Success - Update indices
    // Add to Draft Index
    await this.redis.sadd(indexKey, lockKey);
    // Add to Session Index (store full info or just key? just key + draftId needed for cleanup)
    // We store "draftId:lockKey" in session index to know which draft it belongs to
    await this.redis.sadd(sessionIndexKey, `${draftId}:${lockKey}`);

    // 3. Local Timeout for Event Emission (Best Effort)
    // Construct full LockEntry (with dummy timeoutId initially) for the callback interface
    const entry: LockEntry = {
      ...lockPayload,
      timeoutId: undefined, // Only needed for type compatibility in callback
    };

    // We don't store timeoutId in Redis, just locally for the closure
    // Ideally use a scheduler or delayed queue, but setTimeout is acceptable for MVP event emission
    setTimeout(() => {
      onExpire(entry);
    }, LockService.LOCK_TTL_MS);

    return { ok: true, ownerSessionId };
  }

  /**
   * Release a lock
   */
  async releaseLock(
    draftId: string,
    lockKey: string,
    ownerActorId: string,
    ownerSessionId: string,
  ) {
    // ... (memory logic)

    const redisKey = `${LockService.LOCK_PREFIX}${draftId}:${lockKey}`;
    const indexKey = `${LockService.DRAFT_LOCKS_PREFIX}${draftId}`;
    const sessionIndexKey = `${LockService.SESSION_LOCKS_PREFIX}${ownerSessionId}`;

    // 1. Check ownership
    const currentVal = await this.redis.get(redisKey);
    if (!currentVal) return { ok: true }; // Already gone

    try {
      const lockData = JSON.parse(currentVal) as LockEntryPayload;
      if (
        lockData.ownerActorId !== ownerActorId ||
        lockData.ownerSessionId !== ownerSessionId
      ) {
        return { ok: false, ownerSessionId: lockData.ownerSessionId };
      }
    } catch {
      return { ok: true };
    }

    // 2. Delete
    await this.redis.del(redisKey);
    await this.redis.srem(indexKey, lockKey);
    await this.redis.srem(sessionIndexKey, `${draftId}:${lockKey}`);

    return { ok: true };
  }

  /**
   * Heartbeat (Extend TTL)
   * Redis Strategy: PEXPIRE and GET to verify owner
   */
  async heartbeat(
    draftId: string,
    lockKey: string,
    ownerActorId: string,
    ownerSessionId: string,
    onExpire: (entry: LockEntry) => void,
  ) {
    // ... (memory logic)

    const redisKey = `${LockService.LOCK_PREFIX}${draftId}:${lockKey}`;

    // 1. Check ownership first
    const currentVal = await this.redis.get(redisKey);
    if (!currentVal) {
      return { ok: false, ownerSessionId: null };
    }

    try {
      const lockData = JSON.parse(currentVal) as LockEntryPayload;
      if (
        lockData.ownerActorId !== ownerActorId ||
        lockData.ownerSessionId !== ownerSessionId
      ) {
        return { ok: false, ownerSessionId: lockData.ownerSessionId };
      }
    } catch {
      return { ok: false, ownerSessionId: null };
    }

    // 2. Extend TTL
    const result = await this.redis.pexpire(redisKey, LockService.LOCK_TTL_MS);
    if (result === 0) {
      // Key expired between get and pexpire
      return { ok: false, ownerSessionId: null };
    }

    // 3. Reset local timeout (Best Effort)
    // In a stateless/distributed world, we can't easily "reset" the timeout of a previous acquire call
    // unless we track it locally. But heartbeat might come to a different server.
    // So "onExpire" callback here is tricky.
    // The previous timeout will fire and emit EXPIRED.
    // But since the lock is extended in Redis, the 'expired' event might be a false positive for other peers.
    // HOWEVER, `LOCK_EXPIRED` event usually means "Server thinks it expired".
    // If we want consistent behavior, we might need to just rely on Redis and let the client handle "I lost the lock".
    // For now, to satisfy the interface, we can schedule a NEW timeout.
    // The OLD timeout (on another server or this one) will fire.
    // FIXME: This structure implies duplicative EXPIRED events if heartbeat hops servers.
    // Given the constraints, we will just set a new timeout here to likely cover the new period.
    setTimeout(() => {
      onExpire({
        lockKey,
        ownerActorId,
        ownerSessionId,
        expiresAt: Date.now() + LockService.LOCK_TTL_MS,
        timeoutId: undefined,
      });
    }, LockService.LOCK_TTL_MS);

    return { ok: true, ownerSessionId };
  }

  /**
   * Release all locks for a session
   * Redis Strategy: SMEMBERS session_locks:{sessionId} -> Iterate and Delete
   */
  async releaseLocksForSession(
    draftId: string, // draftId param is unused but kept for interface consistency
    sessionId: string,
    onRelease: (lockKey: string) => void,
  ) {
    // const locks = this.locksByDraft.get(draftId);
    // const sessionLocks = this.locksBySession.get(sessionId);
    // ...

    const sessionIndexKey = `${LockService.SESSION_LOCKS_PREFIX}${sessionId}`;
    const members = await this.redis.smembers(sessionIndexKey);

    if (members.length === 0) return;

    for (const member of members) {
      // member format: "draftId:lockKey"
      // If the method is scoped to a specific draftId (as param suggests), we should filter?
      // The original method `releaseLocksForSession` takes `draftId`.
      // The original implementation: `const locks = this.locksByDraft.get(draftId);`
      // It ONLY releases locks for THAT draftId for THAT session.

      const [storedDraftId, storedLockKey] = member.split(':');
      if (storedDraftId !== draftId) continue;

      const redisKey = `${LockService.LOCK_PREFIX}${storedDraftId}:${storedLockKey}`;
      const indexKey = `${LockService.DRAFT_LOCKS_PREFIX}${storedDraftId}`;

      // We just force delete if it belongs to session (we assume session index is accurate)
      // Ideally we would check ownership again to be safe, but session index is our ownership tracker.
      await this.redis.del(redisKey);
      await this.redis.srem(indexKey, storedLockKey); // remove from draft index
      await this.redis.srem(sessionIndexKey, member); // remove from session index

      onRelease(storedLockKey);
    }
  }

  async releaseLocksForSessionId(
    draftId: string,
    sessionId: string,
    onRelease: (lockKey: string) => void,
  ) {
    return this.releaseLocksForSession(draftId, sessionId, onRelease);
  }

  // Private helpers (Legacy - unused)
  // private getOrCreateDraftLocks(draftId: string) { ... }
  // private clearLockTimeout(lock: LockEntry) { ... }
  // private addSessionLock(sessionId: string, lockKey: string) { ... }
  // private removeSessionLock(sessionId: string, lockKey: string) { ... }
}
