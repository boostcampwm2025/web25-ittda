import { useCallback } from 'react';
import { RecordBlock } from '@/lib/types/record';

export const PERSONAL_DRAFT_KEY = 'personal-record-draft';

// 개인 글은 공통 키, 그룹 내 개인 글은 그룹별로 별도 키를 사용해 서로 다른 글의
// 임시저장이 섞여 노출되지 않도록 한다.
export function getDraftKey(groupId?: string): string {
  return groupId ? `group-${groupId}-record-draft` : PERSONAL_DRAFT_KEY;
}

export interface DraftData {
  title: string;
  blocks: RecordBlock[];
  savedAt: string; // ISO string
}

function serializeBlocks(blocks: RecordBlock[]): RecordBlock[] {
  return blocks.map((block) => {
    if (block.type === 'photos') {
      return {
        ...block,
        value: { ...block.value, tempUrls: [] },
      } as RecordBlock;
    }
    return block;
  });
}

export function useLocalDraft(key: string = PERSONAL_DRAFT_KEY) {
  const saveDraft = useCallback(
    (title: string, blocks: RecordBlock[]) => {
      try {
        const data: DraftData = {
          title,
          blocks: serializeBlocks(blocks),
          savedAt: new Date().toISOString(),
        };
        localStorage.setItem(key, JSON.stringify(data));
      } catch {
        // localStorage unavailable or quota exceeded
      }
    },
    [key],
  );

  const loadDraft = useCallback((): DraftData | null => {
    try {
      const raw = localStorage.getItem(key);
      if (!raw) return null;
      return JSON.parse(raw) as DraftData;
    } catch {
      return null;
    }
  }, [key]);

  const clearDraft = useCallback(() => {
    try {
      localStorage.removeItem(key);
    } catch {
      // ignore
    }
  }, [key]);

  return { saveDraft, loadDraft, clearDraft };
}
