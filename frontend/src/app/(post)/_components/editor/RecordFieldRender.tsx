import {
  RecordBlock,
  BlockValue,
  DateValue,
  TimeValue,
  PhotoValue,
  EmotionValue,
  TableValue,
  RatingValue,
  LocationValue,
} from '@/lib/types/recordField';
import { DateField, TimeField, ContentField } from './core/CoreField';
import { PhotoField } from './photo/PhotoField';
import { EmotionField } from './emotion/EmotionField';
import { TagField } from './tag/TagField';
import { TableField } from './table/TableField';
import { RatingField } from './rating/RatingField';
import { LocationField } from '@/components/map/LocationField';
import MediaField from './media/MediaField';
import {
  FieldType,
  MediaInfoValue,
  TagValue,
  TextValue,
} from '@/lib/types/record';
import { useParams } from 'next/navigation';
import { toast } from 'sonner';
import { memo, useCallback } from 'react';

interface FieldRendererProps {
  block: RecordBlock;
  streamingValue?: BlockValue;
  requestLock: (key: string) => void;
  onUpdate: (blockId: string, val: BlockValue, shouldStream?: boolean) => void;
  onCommit: (blockId: string, val: BlockValue) => void;
  onRemove: (blockId: string) => void;
  onOpenDrawer: (
    type: FieldType | 'layout' | 'saveLayout',
    id?: string,
  ) => void;
  isLastContentBlock: boolean;
  lock: {
    lockKey: string;
    isMyLock: boolean;
    isLockedByOther: boolean;
  };
  draftId?: string;
}

export const RecordFieldRenderer = memo(function RecordFieldRenderer({
  block,
  streamingValue,
  requestLock,
  onUpdate,
  onCommit,
  onRemove,
  onOpenDrawer,
  isLastContentBlock,
  lock,
}: FieldRendererProps) {
  const params = useParams();
  const draftId = params.draftId as string | undefined;

  const displayValue = streamingValue ?? block.value;

  const handleFocus = useCallback(() => {
    if (!lock.isLockedByOther) {
      requestLock(lock.lockKey);
    }
  }, [lock.isLockedByOther, lock.lockKey, requestLock]);

  const handleCommit = useCallback(
    (finalValue?: BlockValue) => {
      if (lock.isMyLock) {
        onCommit(block.id, finalValue ?? displayValue);
      }
    },
    [lock.isMyLock, onCommit, block.id, displayValue],
  );

  const handleLockAndAction = useCallback(() => {
    if (lock.isLockedByOther) {
      toast.error('현재 다른 사용자가 편집 중입니다.');
      return;
    }
    if (draftId) requestLock(lock.lockKey);
    onOpenDrawer(block.type, block.id);
  }, [lock.isLockedByOther, draftId, requestLock, lock.lockKey, onOpenDrawer, block.type, block.id]);

  // 텍스트, 테이블을 위한 락 클릭
  const handleLockedClick = useCallback(() => {
    if (lock.isLockedByOther) {
      toast.error('현재 다른 사용자가 편집 중입니다.');
    }
  }, [lock.isLockedByOther]);

  const handleRemove = useCallback(() => {
    onRemove(block.id);
  }, [onRemove, block.id]);

  const handleUpdateText = useCallback(
    (v: string) => {
      onUpdate(block.id, { text: v });
    },
    [onUpdate, block.id],
  );

  const handleBlurText = useCallback(
    (finalText: string) => {
      handleCommit({ text: finalText });
    },
    [handleCommit],
  );

  const handleTagRemove = useCallback(
    (tag: string) => {
      const newVal = {
        tags: (displayValue as TagValue).tags.filter((t) => t !== tag),
      };
      onUpdate(block.id, newVal, false);
      onCommit(block.id, newVal);
    },
    [displayValue, onUpdate, block.id, onCommit],
  );

  const handleTableUpdate = useCallback(
    (d: TableValue | null) => {
      if (d) {
        onUpdate(block.id, d);
      } else {
        onRemove(block.id);
      }
    },
    [onUpdate, block.id, onRemove],
  );

  switch (block.type) {
    case 'date':
      return (
        <DateField
          date={displayValue as DateValue}
          onClick={handleLockAndAction}
        />
      );
    case 'time':
      return (
        <TimeField
          time={displayValue as TimeValue}
          onClick={handleLockAndAction}
        />
      );
    case 'content':
      return (
        <ContentField
          value={displayValue as TextValue}
          onChange={handleUpdateText}
          onRemove={handleRemove}
          isLocked={lock?.isLockedByOther}
          isMyLock={lock.isMyLock}
          onFocus={handleFocus}
          onBlur={handleBlurText}
          isLastContentBlock={isLastContentBlock}
          onLockedClick={handleLockedClick}
        />
      );
    case 'photos':
      return (
        <PhotoField
          photos={displayValue as PhotoValue}
          onClick={handleLockAndAction}
          onRemove={handleRemove}
          draftId={draftId}
        />
      );
    case 'emotion':
      return (
        <EmotionField
          emotion={displayValue as EmotionValue}
          onClick={handleLockAndAction}
          onRemove={handleRemove}
        />
      );
    case 'tags':
      return (
        <TagField
          tags={displayValue as TagValue}
          onRemove={handleTagRemove}
          onAdd={handleLockAndAction}
          onRemoveField={handleRemove}
        />
      );
    case 'table':
      return (
        <TableField
          data={displayValue as TableValue}
          onUpdate={handleTableUpdate}
          isLocked={lock.isLockedByOther}
          isMyLock={lock.isMyLock}
          onFocus={handleFocus}
          onBlur={handleCommit}
          onLockedClick={handleLockedClick}
        />
      );
    case 'rating':
      return (
        <RatingField
          value={displayValue as RatingValue}
          onClick={handleLockAndAction}
          onRemove={handleRemove}
        />
      );
    case 'location':
      return (
        <LocationField
          location={displayValue as LocationValue}
          onClick={handleLockAndAction}
          onRemove={handleRemove}
        />
      );
    case 'media':
      return (
        <MediaField
          data={displayValue as MediaInfoValue}
          onClick={handleLockAndAction}
          onRemove={handleRemove}
        />
      );
    default:
      return null;
  }
});
