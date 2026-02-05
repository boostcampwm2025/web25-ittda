import { Injectable } from '@nestjs/common';
import { RedisService } from '@liaoliaots/nestjs-redis';

import type { Redis } from 'ioredis';

@Injectable()
export class DraftStateService {
  private readonly touchedByDraft = new Map<string, Set<string>>();
  // Legacy in-memory mutex refactoring note:
  // - publishingDrafts -> Redis SET "draft_publishing:{draftId}"

  private static readonly PUBLISH_LOCK_PREFIX = 'draft_publishing:';
  private static readonly PUBLISH_LOCK_TTL_SEC = 60; // 1 minute safety net

  private readonly redis: Redis;

  constructor(private readonly redisService: RedisService) {
    this.redis = this.redisService.getOrThrow();
  }

  addTouchedBy(draftId: string, actorId: string) {
    const existing = this.touchedByDraft.get(draftId);
    if (existing) {
      existing.add(actorId);
      return;
    }
    this.touchedByDraft.set(draftId, new Set([actorId]));
  }

  getTouchedBy(draftId: string) {
    return Array.from(this.touchedByDraft.get(draftId) ?? []);
  }

  clearTouchedBy(draftId: string) {
    this.touchedByDraft.delete(draftId);
  }

  async startPublishing(draftId: string): Promise<boolean> {
    const key = `${DraftStateService.PUBLISH_LOCK_PREFIX}${draftId}`;
    const result = await this.redis.set(
      key,
      '1',
      'EX',
      DraftStateService.PUBLISH_LOCK_TTL_SEC,
      'NX',
    );
    return result === 'OK';
  }

  async finishPublishing(draftId: string) {
    const key = `${DraftStateService.PUBLISH_LOCK_PREFIX}${draftId}`;
    await this.redis.del(key);
  }

  async isPublishing(draftId: string) {
    const key = `${DraftStateService.PUBLISH_LOCK_PREFIX}${draftId}`;
    const exists = await this.redis.exists(key);
    return exists === 1;
  }
}
