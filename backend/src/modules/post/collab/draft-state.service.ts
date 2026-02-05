import { Injectable } from '@nestjs/common';

@Injectable()
export class DraftStateService {
  private readonly touchedByDraft = new Map<string, Set<string>>();
  private readonly publishingDrafts = new Set<string>();

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

  startPublishing(draftId: string) {
    if (this.publishingDrafts.has(draftId)) return false;
    this.publishingDrafts.add(draftId);
    return true;
  }

  finishPublishing(draftId: string) {
    this.publishingDrafts.delete(draftId);
  }

  isPublishing(draftId: string) {
    return this.publishingDrafts.has(draftId);
  }
}
