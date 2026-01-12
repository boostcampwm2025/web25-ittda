'use client';

import { useState, useRef, useEffect } from 'react';
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
import { PostBlock, MediaValue, BlockValue } from '@/lib/types/recordField';
import { useRecordEditorDnD } from '../../_hooks/useRecordEditorDnD';
import {
  canBeHalfWidth,
  getDefaultValue,
  normalizeLayout,
} from '../../_utils/recordLayoutHelper';
import SaveTemplateDrawer from './core/SaveTemplateDrawer';
import LayoutTemplateDrawer from './core/LayoutTemplateDrawer';
import { TemplateRecord } from '@/lib/types/template';

// 개수 제한
const MULTI_INSTANCE_LIMITS: Partial<Record<FieldType, number>> = {
  emotion: 4,
  table: 4,
  content: 4,
  photos: 10,
};

export default function PostEditor({
  mode,
  initialPost,
}: {
  mode: 'add' | 'edit';
  initialPost?: { title: string; blocks: PostBlock[] };
}) {
  const [title, setTitle] = useState(initialPost?.title ?? '');

  // 전체 블록 상태
  const [blocks, setBlocks] = useState<PostBlock[]>([]);

  const [activeDrawer, setActiveDrawer] = useState<{
    type: FieldType | 'layout' | 'saveLayout';
    id?: string;
  } | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const {
    gridRef,
    isDraggingId,
    setIsDraggingId,
    handleDragStart,
    handleDragOver,
    handleGridDragOver,
  } = useRecordEditorDnD(blocks, setBlocks, canBeHalfWidth);

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
      })) as PostBlock[];
      setBlocks(normalizeLayout(initialBlocks));
    }
  }, [initialPost]);

  // 필드 값 업데이트 또는 신규 추가 함수
  const updateFieldValue = (
    value: BlockValue,
    id?: string,
    type?: FieldType,
  ) => {
    if (id && id !== 'new') {
      // ID가 존재하는 경우: 기존 블록 업데이트
      setBlocks((prev) =>
        prev.map((b) => (b.id === id ? { ...b, value } : b) as PostBlock),
      );
    } else if (type) {
      // ID가 없는 경우: 신규 블록 생성 및 추가
      const newBlock = {
        id: uuidv4(),
        type,
        value,
        layout: { row: 0, col: 0, span: 2 },
      } as PostBlock;

      setBlocks((prev) => normalizeLayout([...prev, newBlock]));
    }
  };

  const addOrShowBlock = (type: FieldType) => {
    const singleInstanceTypes: FieldType[] = [
      'date',
      'time',
      'rating',
      'location',
      'tags',
      'photos',
      'media',
    ];

    const existingBlocks = blocks.filter((b) => b.type === type);

    if (singleInstanceTypes.includes(type) && existingBlocks.length > 0) {
      setActiveDrawer({ type, id: existingBlocks[0].id });
      return;
    }
    const limit = MULTI_INSTANCE_LIMITS[type];
    if (limit && existingBlocks.length >= limit) {
      //TODO : toast 추가 후 변경
      alert(`${type} 필드는 최대 ${limit}개까지만 추가 가능합니다.`);
      return;
    }

    const newDrawerTypes = [
      'tags',
      'rating',
      'photos',
      'emotion',
      'location',
      'media',
    ];

    if (newDrawerTypes.includes(type)) {
      setActiveDrawer({ type });
      return;
    }

    const newId = uuidv4();
    const newBlock = {
      id: newId,
      type,
      value: getDefaultValue(type),
      layout: { row: 0, col: 0, span: 2 },
    } as PostBlock;

    setBlocks((prev) => normalizeLayout([...prev, newBlock]));

    const drawerTypes = [
      'date',
      'time',
      'tags',
      'rating',
      'photos',
      'emotion',
      'location',
      'media',
      'layout',
      'saveLayout',
    ];

    if (drawerTypes.includes(type)) {
      setActiveDrawer({ type, id: newId });
    }
  };

  const removeBlock = (id: string) => {
    setBlocks((prev) => normalizeLayout(prev.filter((b) => b.id !== id)));
  };

  const handleSave = () => {
    const payload = { title, blocks };
    console.log('Save:', payload);
  };

  const handleApplyTemplate = (template: TemplateRecord) => {
    const newBlocks = template.blocks.map((tBlock) => ({
      id: uuidv4(),
      type: tBlock.type as FieldType,
      value: getDefaultValue(tBlock.type as FieldType),
      layout: { ...tBlock.layout },
    })) as PostBlock[];

    setBlocks(normalizeLayout(newBlocks));
    setActiveDrawer(null);
  };

  const renderField = (block: PostBlock) => {
    switch (block.type) {
      case 'date':
        return (
          <DateField
            date={block.value}
            onClick={() => setActiveDrawer({ type: 'date', id: block.id })}
          />
        );
      case 'time':
        return (
          <TimeField
            time={block.value}
            onClick={() => setActiveDrawer({ type: 'time', id: block.id })}
          />
        );
      case 'content':
        return (
          <ContentField
            value={block.value}
            onChange={(v) => updateFieldValue(v, block.id)}
          />
        );
      case 'photos':
        return (
          <PhotoField
            photos={block.value as unknown as string[]}
            onClick={() => setActiveDrawer({ type: 'photos', id: block.id })}
            onRemove={() => removeBlock(block.id)}
          />
        );
      case 'emotion':
        return (
          <EmotionField
            emotion={block.value}
            onClick={() => setActiveDrawer({ type: 'emotion', id: block.id })}
            onRemove={() => removeBlock(block.id)}
          />
        );
      case 'tags':
        return (
          <TagField
            tags={block.value}
            onRemove={(tag) =>
              updateFieldValue(
                block.value.filter((t) => t !== tag),
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
            onUpdate={(d) =>
              d ? updateFieldValue(d, block.id) : removeBlock(block.id)
            }
          />
        );
      case 'rating':
        return (
          <RatingField
            value={block.value}
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

    const handleDone = (val: BlockValue) => {
      updateFieldValue(val, id, type as FieldType);
      setActiveDrawer(null);
    };

    switch (type) {
      case 'date':
        return (
          <DateDrawer
            mode="single"
            currentDate={initialValue as string}
            onSelectDate={handleDone}
            onClose={() => setActiveDrawer(null)}
          />
        );
      case 'time':
        return (
          <TimePickerDrawer
            currentTime={initialValue as string}
            onSave={handleDone}
            onClose={() => setActiveDrawer(null)}
          />
        );
      case 'tags':
        return (
          <TagDrawer
            onClose={() => setActiveDrawer(null)}
            tags={initialValue as string[]}
            previousTags={['식단', '운동']} //TODO: 실제 최근 사용 태그 리스트
            onUpdateTags={(nt) => {
              debugger;
              if (id) updateFieldValue(nt, id);
              else handleDone(nt);
            }}
          />
        );
      case 'rating':
        return (
          <RatingDrawer
            rating={{ value: initialValue as number, max: 5 }}
            onUpdateRating={(nr) => handleDone(nr.value)}
            onClose={() => setActiveDrawer(null)}
          />
        );
      case 'photos':
        return (
          <PhotoDrawer
            photos={initialValue as string[]}
            onUploadClick={() => fileInputRef.current?.click()}
            onRemovePhoto={(idx) => {
              const next = (initialValue as string[]).filter(
                (_, i) => i !== idx,
              );
              if (id) updateFieldValue(next, id);
              else handleDone(next);
            }}
            onRemoveAll={() => id && updateFieldValue([], id)}
            onClose={() => setActiveDrawer(null)}
          />
        );
      case 'emotion':
        return (
          <EmotionDrawer
            isOpen={true}
            selectedEmotion={initialValue as string}
            onSelect={handleDone}
            onClose={() => setActiveDrawer(null)}
          />
        );
      case 'location':
        return (
          <LocationDrawer
            mode="post"
            onSelect={handleDone}
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
        onChange={async (e) => {
          const files = e.target.files;
          if (!files || !activeDrawer?.id) return;

          const MAX_PHOTO_COUNT = MULTI_INSTANCE_LIMITS['photos'] ?? 10;
          const blockId = activeDrawer.id;
          const targetBlock = blocks.find((b) => b.id === blockId);

          if (targetBlock?.type === 'photos') {
            const existingPhotos = targetBlock.value as unknown as string[];
            const availableSlots = MAX_PHOTO_COUNT - existingPhotos.length;

            if (availableSlots <= 0) {
              // TODO :이후 toast 등으로 변경
              alert(`이미 최대 개수인 ${MAX_PHOTO_COUNT}개를 모두 채웠습니다.`);
              e.target.value = '';
              return;
            }
            const filesToProcess = Array.from(files).slice(0, availableSlots);

            if (files.length > availableSlots) {
              // TODO :이후 toast 등으로 변경
              alert(
                `최대 10개 제한으로 인해 상위 ${availableSlots}개의 파일만 추가됩니다.`,
              );
            }

            const readFilesPromises = filesToProcess.map((file) => {
              return new Promise<string>((resolve, reject) => {
                const reader = new FileReader();
                reader.onload = (ev) => resolve(ev.target?.result as string);
                reader.onerror = reject;
                reader.readAsDataURL(file);
              });
            });

            try {
              const newImages = await Promise.all(readFilesPromises);
              updateFieldValue([...existingPhotos, ...newImages], blockId);
            } catch (error) {
              console.error('파일을 읽는 중 오류 발생:', error);
            } finally {
              e.target.value = '';
            }
          }
        }}
      />
      {renderActiveDrawer()}
    </div>
  );
}
