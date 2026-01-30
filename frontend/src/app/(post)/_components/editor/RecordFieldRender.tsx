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

interface FieldRendererProps {
  block: RecordBlock;
  streamingValue?: BlockValue;
  requestLock: (key: string) => void;
  onUpdate: (blockId: string, val: BlockValue) => void;
  onCommit: (blockId: string, val: BlockValue) => void;
  onRemove: (blockId: string) => void;
  onOpenDrawer: (
    type: FieldType | 'layout' | 'saveLayout',
    id?: string,
  ) => void;
  goToLocationPicker: () => void;
  isLastContentBlock: boolean;
  lock: {
    lockKey: string;
    isMyLock: boolean;
    isLockedByOther: boolean;
  };
  draftId?: string;
}

export function RecordFieldRenderer({
  block,
  streamingValue,
  requestLock,
  onUpdate,
  onCommit,
  onRemove,
  onOpenDrawer,
  goToLocationPicker,
  isLastContentBlock,
  lock,
}: FieldRendererProps) {
  const params = useParams();
  const draftId = params.draftId as string | undefined;

  const displayValue = streamingValue ?? block.value;

  const handleFocus = () => {
    if (!lock.isLockedByOther) {
      requestLock(lock.lockKey);
    }
  };

  const handleCommit = (finalValue?: BlockValue) => {
    if (lock.isMyLock) {
      onCommit(block.id, finalValue ?? displayValue);
    }
  };
  const handleLockAndAction = () => {
    if (lock.isLockedByOther) return;
    if (draftId && block.type !== 'location') requestLock(lock.lockKey);
    if (block.type === 'location') goToLocationPicker();
    else onOpenDrawer(block.type, block.id);
  };

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
          onChange={(v) => onUpdate(block.id, { text: v })}
          onRemove={() => onRemove(block.id)}
          isLocked={lock?.isLockedByOther}
          isMyLock={lock.isMyLock}
          onFocus={handleFocus}
          onBlur={(finalText) => handleCommit({ text: finalText })}
          isLastContentBlock={isLastContentBlock}
        />
      );
    case 'photos':
      return (
        <PhotoField
          photos={displayValue as PhotoValue}
          onClick={handleLockAndAction}
          onRemove={() => onRemove(block.id)}
          draftId={draftId}
        />
      );
    case 'emotion':
      return (
        <EmotionField
          emotion={displayValue as EmotionValue}
          onClick={handleLockAndAction}
          onRemove={() => onRemove(block.id)}
        />
      );
    case 'tags':
      return (
        <TagField
          tags={displayValue as TagValue}
          onRemove={(tag) => {
            const newVal = {
              tags: (displayValue as TagValue).tags.filter((t) => t !== tag),
            };
            onUpdate(block.id, newVal);
            onCommit(block.id, newVal);
          }}
          onAdd={handleLockAndAction}
          onRemoveField={() => onRemove(block.id)}
        />
      );
    case 'table':
      return (
        <TableField
          data={displayValue as TableValue}
          onUpdate={(d) => (d ? onUpdate(block.id, d) : onRemove(block.id))}
          isLocked={lock.isLockedByOther}
          isMyLock={lock.isMyLock}
          onFocus={handleFocus}
          onBlur={handleCommit}
        />
      );
    case 'rating':
      return (
        <RatingField
          value={displayValue as RatingValue}
          onClick={handleLockAndAction}
          onRemove={() => onRemove(block.id)}
        />
      );
    case 'location':
      return (
        <LocationField
          location={displayValue as LocationValue}
          onClick={handleLockAndAction}
          onRemove={() => onRemove(block.id)}
        />
      );
    case 'media':
      return (
        <MediaField
          data={displayValue as MediaInfoValue}
          onClick={handleLockAndAction}
          onRemove={() => onRemove(block.id)}
        />
      );
    default:
      return null;
  }
}
