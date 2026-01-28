import { useEffect, useRef } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { normalizeLayout, getDefaultValue } from '../_utils/recordLayoutHelper';
import { FieldType, LocationValue } from '@/lib/types/record';
import { RecordBlock } from '@/lib/types/recordField';

interface Params {
  initialPost?: { title: string; blocks: RecordBlock[] };
  onInitialized: (data: { title: string; blocks: RecordBlock[] }) => void;
  onLocationUpdate?: (location: LocationValue | null) => void;
}

export function usePostEditorInitializer({
  initialPost,
  onInitialized,
  onLocationUpdate,
}: Params) {
  const hasInitializedRef = useRef(false);

  useEffect(() => {
    if (hasInitializedRef.current) return;
    hasInitializedRef.current = true;

    const savedDraft = sessionStorage.getItem('editor_draft');
    const selectedLoc = sessionStorage.getItem('selected_location');

    let baseTitle = '';
    let baseBlocks: RecordBlock[] = [];

    if (savedDraft) {
      const parsed = JSON.parse(savedDraft);
      baseTitle = parsed.title;
      baseBlocks = parsed.blocks;
      sessionStorage.removeItem('editor_draft');
    } else if (initialPost?.blocks) {
      baseTitle = initialPost.title;
      baseBlocks = normalizeLayout(initialPost.blocks);
    } else {
      const initialTypes: FieldType[] = ['date', 'time', 'content'];
      baseBlocks = normalizeLayout(
        initialTypes.map((type) => ({
          id: uuidv4(),
          type,
          value: getDefaultValue(type),
          layout: { row: 0, col: 0, span: 2 },
        })) as RecordBlock[],
      );
    }

    if (selectedLoc) {
      const locationData = JSON.parse(selectedLoc);
      const idx = baseBlocks.findIndex((b) => b.type === 'location');

      if (idx > -1) {
        baseBlocks = baseBlocks.map((b, i) =>
          i === idx ? { ...b, value: locationData } : b,
        );
      } else {
        baseBlocks = normalizeLayout([
          ...baseBlocks,
          {
            id: uuidv4(),
            type: 'location',
            value: locationData,
            layout: { row: 0, col: 0, span: 2 },
          },
        ]);
      }

      sessionStorage.removeItem('selected_location');
    }

    onInitialized({
      title: baseTitle,
      blocks: baseBlocks,
    });
  }, [initialPost, onInitialized]);

  useEffect(() => {
    const handleLocationEvent = (event: Event) => {
      const locationData = (event as CustomEvent<LocationValue>).detail;
      if (onLocationUpdate) {
        onLocationUpdate(locationData);
      }
    };

    window.addEventListener('locationSelected', handleLocationEvent);
    return () =>
      window.removeEventListener('locationSelected', handleLocationEvent);
  }, [onLocationUpdate]);
}
