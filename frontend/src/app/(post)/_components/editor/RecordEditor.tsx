'use client';

import { useState, useEffect } from 'react';
import { GripVertical } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';

// 컴포넌트 및 필드 임포트
import RecordEditorHeader from './RecordEditorHeader';
import RecordTitleInput from './RecordTitleInput';
import Toolbar from './Toolbar';
import { DateField, TimeField, ContentField } from './core/CoreField';
import { PhotoField } from './photo/PhotoField';
import { EmotionField } from './emotion/EmotionField';
import { TagField } from './tag/TagField';
import { TableField } from './table/TableField';
import { RatingField } from './rating/RatingField';
import { LocationField } from '@/components/map/LocationField';
import MediaField from './media/MediaField';

// 드로어
import DateDrawer from '@/components/DateDrawer';
import TimePickerDrawer from './core/TimePickerDrawer';
import TagDrawer from './tag/TagDrawer';
import RatingDrawer from './rating/RatingPickerDrawer';
import PhotoDrawer from './photo/PhotoDrawer';
import EmotionDrawer from './emotion/EmotionDrawer';
import LocationDrawer from '@/components/map/LocationDrawer';
import MediaDrawer from './media/MediaDrawer';

// 타입
import { FieldType } from '@/lib/types/record';
import {
  RecordBlock,
  MediaValue,
  TagsValue,
  RatingValue,
  TimeValue,
  PhotoValue,
} from '@/lib/types/recordField';
import {
  canBeHalfWidth,
  getDefaultValue,
  normalizeLayout,
} from '../../_utils/recordLayoutHelper';
import SaveTemplateDrawer from './core/SaveTemplateDrawer';
import LayoutTemplateDrawer from './core/LayoutTemplateDrawer';
import { useRecordEditorDnD } from '../../_hooks/useRecordEditorDnD';
import { usePostEditorBlocks } from '../../_hooks/usePostEditorBlocks';
import { useCreateRecord } from '@/hooks/useCreateRecord';
import { mapBlocksToPayload } from '@/lib/utils/mapBlocksToPayload';

export default function PostEditor({
  mode,
  initialPost,
}: {
  mode: 'add' | 'edit';
  initialPost?: { title: string; blocks: RecordBlock[] };
}) {
  const [title, setTitle] = useState(initialPost?.title ?? '');
  const { mutate: createRecord, isPending } = useCreateRecord();

  const {
    blocks,
    setBlocks,
    activeDrawer,
    setActiveDrawer,
    fileInputRef,
    updateFieldValue,
    handleDone,
    addOrShowBlock,
    removeBlock,
    handleApplyTemplate,
    handlePhotoUpload,
  } = usePostEditorBlocks();

  const {
    gridRef,
    isDraggingId,
    setIsDraggingId,
    handleDragStart,
    handleDragOver,
    handleGridDragOver,
  } = useRecordEditorDnD(blocks, setBlocks, canBeHalfWidth);

  // 초기화 로직
  // TODO: 이후 키 형태로 변경
  useEffect(() => {
    if (initialPost?.blocks) {
      setBlocks(normalizeLayout(initialPost.blocks));
    } else {
      const initialTypes: FieldType[] = ['date', 'time', 'content'];
      const initialBlocks = initialTypes.map((type) => ({
        id: uuidv4(),
        type,
        value: getDefaultValue(type),
        layout: { row: 0, col: 0, span: 2 },
      })) as RecordBlock[];
      setBlocks(normalizeLayout(initialBlocks));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialPost]);

  const handleSave = () => {
    const payload = {
      scope: 'PERSONAL',
      title,
      blocks: mapBlocksToPayload(blocks),
    };
    createRecord(payload);
  };

  const renderField = (block: RecordBlock) => {
    switch (block.type) {
      case 'date':
        return (
          <DateField
            date={block.value.date}
            onClick={() => setActiveDrawer({ type: 'date', id: block.id })}
          />
        );
      case 'time':
        return (
          <TimeField
            time={block.value.time}
            onClick={() => setActiveDrawer({ type: 'time', id: block.id })}
          />
        );
      case 'content':
        const contentBlockCount = blocks.filter(
          (b) => b.type === 'content',
        ).length;
        const isLastContentBlock = contentBlockCount === 1;
        return (
          <ContentField
            value={block.value.text}
            onChange={(v) => updateFieldValue({ text: v }, block.id)}
            onRemove={() => removeBlock(block.id)}
            isLastContentBlock={isLastContentBlock}
          />
        );
      case 'photos':
        return (
          <PhotoField
            photos={block.value as PhotoValue}
            onClick={() => setActiveDrawer({ type: 'photos', id: block.id })}
            onRemove={() => removeBlock(block.id)}
          />
        );
      case 'emotion':
        return (
          <EmotionField
            emotion={block.value.mood}
            onClick={() => setActiveDrawer({ type: 'emotion', id: block.id })}
            onRemove={() => removeBlock(block.id)}
          />
        );
      case 'tags':
        return (
          <TagField
            tags={block.value.tags}
            onRemove={(tag) =>
              updateFieldValue(
                { tags: block.value.tags.filter((t) => t !== tag) },
                block.id,
              )
            }
            onAdd={() => setActiveDrawer({ type: 'tags', id: block.id })}
            onRemoveField={() => removeBlock(block.id)}
          />
        );
      case 'table':
        return (
          <TableField
            data={block.value}
            onUpdate={(d) => {
              debugger;
              d ? updateFieldValue(d, block.id) : removeBlock(block.id);
            }}
          />
        );
      case 'rating':
        return (
          <RatingField
            value={block.value.rating}
            max={5}
            onClick={() => setActiveDrawer({ type: 'rating', id: block.id })}
            onRemove={() => removeBlock(block.id)}
          />
        );
      case 'location':
        return (
          <LocationField
            address={block.value.address}
            onClick={() => setActiveDrawer({ type: 'location', id: block.id })}
            onRemove={() => removeBlock(block.id)}
          />
        );
      case 'media':
        return (
          <MediaField
            data={block.value as MediaValue}
            onClick={() => setActiveDrawer({ type: 'media', id: block.id })}
            onRemove={() => removeBlock(block.id)}
          />
        );
      default:
        return null;
    }
  };

  const renderActiveDrawer = () => {
    if (!activeDrawer) return null;
    const { type, id } = activeDrawer;

    if (type === 'layout') {
      return (
        <LayoutTemplateDrawer
          isOpen={true}
          onClose={() => setActiveDrawer(null)}
          customTemplates={[]} //TODO: 커스텀 필드 관련 데이터
          onSelect={handleApplyTemplate}
        />
      );
    }

    if (type === 'saveLayout') {
      return (
        <SaveTemplateDrawer
          isOpen={true}
          onClose={() => setActiveDrawer(null)}
          onSave={() => {}} // TODO: 사용자 맞춤 템플릿 저장 로직
        />
      );
    }

    const block = id ? blocks.find((b) => b.id === id) : null;
    const initialValue = block
      ? block.value
      : getDefaultValue(type as FieldType);

    switch (type) {
      case 'date':
        return (
          <DateDrawer
            mode="single"
            currentDate={initialValue as string}
            onSelectDate={(v) => handleDone({ date: v })}
            onClose={() => setActiveDrawer(null)}
          />
        );
      case 'time':
        return (
          <TimePickerDrawer
            currentTime={initialValue as TimeValue}
            onSave={(v) => handleDone({ time: v })}
            onClose={() => setActiveDrawer(null)}
          />
        );
      case 'tags':
        return (
          <TagDrawer
            onClose={() => setActiveDrawer(null)}
            tags={initialValue as TagsValue}
            previousTags={['식단', '운동']} //TODO: 실제 최근 사용 태그 리스트
            onUpdateTags={(nt) => handleDone({ tags: nt }, false)}
          />
        );
      case 'rating':
        return (
          <RatingDrawer
            rating={initialValue as RatingValue}
            onUpdateRating={(nr) => handleDone({ rating: nr.rating })}
            onClose={() => setActiveDrawer(null)}
          />
        );
      case 'photos':
        const photoBlock = block as Extract<RecordBlock, { type: 'photos' }>;
        const photoValue = photoBlock?.value || { mediaIds: [], tempUrls: [] };

        return (
          <PhotoDrawer
            photos={photoValue}
            onUploadClick={() => fileInputRef.current?.click()}
            onRemovePhoto={(idx) => {
              //TODO: 임시로 mediaIds, tempUrls 각각 취급하고 tempUrls 에만 경로 넣어줌
              // 이후 백엔드 로직 확정 시 변경
              const mediaIds = photoValue.mediaIds || [];
              const tempUrls = photoValue.tempUrls || [];

              let nextValue;
              if (idx < mediaIds.length) {
                nextValue = {
                  ...photoValue,
                  mediaIds: mediaIds.filter((_, i) => i !== idx),
                };
              } else {
                nextValue = {
                  ...photoValue,
                  tempUrls: tempUrls.filter(
                    (_, i) => i !== idx - mediaIds.length,
                  ),
                };
              }

              if (id) updateFieldValue(nextValue, id);
              else handleDone(nextValue);
            }}
            onRemoveAll={() => {
              const emptyValue = { mediaIds: [], tempUrls: [] };
              if (id) updateFieldValue(emptyValue, id);
              else handleDone(emptyValue);
            }}
            onClose={() => setActiveDrawer(null)}
          />
        );
      case 'emotion':
        return (
          <EmotionDrawer
            isOpen={true}
            selectedEmotion={initialValue as string}
            onSelect={(v) => handleDone({ mood: v })}
            onClose={() => setActiveDrawer(null)}
          />
        );
      case 'location':
        return (
          <LocationDrawer
            mode="post"
            onSelect={(v) =>
              handleDone({
                lat: v.lat || 0,
                lng: v.lng || 0,
                address: v.address || '',
                placeName: v.placeName || '',
              })
            }
            onClose={() => setActiveDrawer(null)}
          />
        );
      case 'media':
        return (
          <MediaDrawer
            onSelect={handleDone}
            onClose={() => setActiveDrawer(null)}
          />
        );
      default:
        return null;
    }
  };

  return (
    <div className="w-full flex flex-col min-h-screen bg-white dark:bg-[#121212]">
      <RecordEditorHeader mode={mode} onSave={handleSave} />
      <main className="px-6 py-6 space-y-8 pb-48 overflow-y-auto">
        <RecordTitleInput value={title} onChange={setTitle} />
        <div
          ref={gridRef}
          onDragOver={handleGridDragOver}
          className="grid grid-cols-2 gap-x-3 gap-y-5 items-center transition-all duration-300"
        >
          {blocks.map((block) => (
            <div
              key={block.id}
              draggable
              onDragStart={() => handleDragStart(block.id)}
              onDragOver={(e) => handleDragOver(e, block.id)}
              onDragEnd={() => setIsDraggingId(null)}
              className={`relative transition-all duration-300 group/field ${block.layout.span === 1 ? 'col-span-1' : 'col-span-2'} ${isDraggingId === block.id ? 'opacity-20 scale-95' : 'opacity-100'}`}
            >
              <div className="absolute -left-6 top-1/2 -translate-y-1/2 flex items-center justify-center w-6 h-full opacity-30 transition-opacity cursor-grab active:cursor-grabbing">
                <GripVertical className="w-4 h-4 text-gray-500" />
              </div>
              <div className="w-full">{renderField(block)}</div>
            </div>
          ))}
        </div>
      </main>
      <Toolbar onAddBlock={addOrShowBlock} onOpenDrawer={setActiveDrawer} />

      <input
        type="file"
        ref={fileInputRef}
        className="hidden"
        multiple
        accept="image/*,video/*"
        onChange={handlePhotoUpload}
      />
      {renderActiveDrawer()}
    </div>
  );
}
