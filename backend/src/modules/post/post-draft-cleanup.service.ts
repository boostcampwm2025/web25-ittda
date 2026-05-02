import { Injectable } from '@nestjs/common';
import { EntityManager, In } from 'typeorm';

import { PostDraft } from './entity/post-draft.entity';
import { PostDraftMedia } from './entity/post-draft-media.entity';
import { PostDraftGateway } from './post-draft.gateway';

export type DraftInvalidationReason =
  | 'GROUP_DELETED'
  | 'GROUP_LEFT'
  | 'GROUP_MEMBER_REMOVED'
  | 'OWNER_WITHDRAWN'
  | 'PERMISSION_REVOKED';

export type DraftInvalidationResult = {
  draftIds: string[];
  groupIds: string[];
  reason: DraftInvalidationReason;
};

@Injectable()
export class PostDraftCleanupService {
  constructor(private readonly postDraftGateway: PostDraftGateway) {}

  async invalidateGroupDraftsWithManager(
    manager: EntityManager,
    groupId: string,
    reason: DraftInvalidationReason,
  ): Promise<DraftInvalidationResult> {
    const draftRepo = manager.getRepository(PostDraft);

    const drafts = await draftRepo.find({
      where: { groupId, isActive: true },
      select: { id: true, groupId: true },
    });

    return this.invalidateDraftsWithManager(manager, drafts, reason);
  }

  async invalidateOwnedDraftsInGroupWithManager(
    manager: EntityManager,
    ownerActorId: string,
    groupId: string,
    reason: DraftInvalidationReason,
  ): Promise<DraftInvalidationResult> {
    const draftRepo = manager.getRepository(PostDraft);

    const drafts = await draftRepo.find({
      where: { ownerActorId, groupId, isActive: true },
      select: { id: true, groupId: true },
    });

    return this.invalidateDraftsWithManager(manager, drafts, reason);
  }

  async notifyDraftInvalidations(
    results: DraftInvalidationResult[],
  ): Promise<void> {
    const draftIdsByReason = new Map<DraftInvalidationReason, Set<string>>();
    const groupIds = new Set<string>();

    results.forEach((result) => {
      result.groupIds.forEach((groupId) => groupIds.add(groupId));

      if (result.draftIds.length === 0) {
        return;
      }

      const draftIds = draftIdsByReason.get(result.reason) ?? new Set<string>();
      result.draftIds.forEach((draftId) => draftIds.add(draftId));
      draftIdsByReason.set(result.reason, draftIds);
    });

    for (const [reason, draftIds] of draftIdsByReason) {
      this.postDraftGateway.invalidateDrafts([...draftIds], reason);
    }

    if (groupIds.size > 0) {
      await this.postDraftGateway.refreshGroupDraftSnapshots([...groupIds]);
    }
  }

  private async invalidateDraftsWithManager(
    manager: EntityManager,
    drafts: Array<Pick<PostDraft, 'id' | 'groupId'>>,
    reason: DraftInvalidationReason,
  ): Promise<DraftInvalidationResult> {
    const groupIds = Array.from(
      new Set(drafts.map((draft) => draft.groupId).filter(Boolean)),
    );

    if (drafts.length === 0) {
      return { draftIds: [], groupIds, reason };
    }

    const draftIds = drafts.map((draft) => draft.id);
    const draftRepo = manager.getRepository(PostDraft);
    const draftMediaRepo = manager.getRepository(PostDraftMedia);

    await draftRepo.update({ id: In(draftIds) }, { isActive: false });
    await draftMediaRepo.delete({ draftId: In(draftIds) });

    return { draftIds, groupIds, reason };
  }
}
