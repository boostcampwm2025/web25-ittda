import { useEffect, useRef } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { normalizeLayout, getDefaultValue } from '../_utils/recordLayoutHelper';
import { FieldType } from '@/lib/types/record';
import { RecordBlock } from '@/lib/types/recordField';

interface Params {
  initialPost?: { title: string; blocks: RecordBlock[] };
  initialDate?: string;
  onInitialized: (data: { title: string; blocks: RecordBlock[] }) => void;
}

export function usePostEditorInitializer({
  initialPost,
  initialDate,
  onInitialized,
}: Params) {
  const hasInitializedRef = useRef(false);

  useEffect(() => {
    if (hasInitializedRef.current) return;
    hasInitializedRef.current = true;

    let baseTitle = '';
    let baseBlocks: RecordBlock[] = [];

    if (initialPost?.blocks) {
      baseTitle = initialPost.title;
      baseBlocks = normalizeLayout(initialPost.blocks);
    } else {
      const initialTypes: FieldType[] = ['date', 'time', 'content'];
      baseBlocks = normalizeLayout(
        initialTypes.map((type) => ({
          id: uuidv4(),
          type,
          value:
            type === 'date' && initialDate
              ? { date: initialDate }
              : getDefaultValue(type),
          layout: { row: 0, col: 0, span: 2 },
        })) as RecordBlock[],
      );
    }

    onInitialized({
      title: baseTitle,
      blocks: baseBlocks,
    });
  }, [initialPost, initialDate, onInitialized]);
}
