import { useCallback } from 'react';
import { RecordBlock } from '@/lib/types/record';

export const PERSONAL_DRAFT_KEY = 'personal-record-draft';

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
