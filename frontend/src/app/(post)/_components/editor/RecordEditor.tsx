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
import { PostBlock, MediaValue } from '@/lib/types/recordField';
import { formatDateDot, formatTime } from '@/lib/date';

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
    type: FieldType;
    id: string;
  } | null>(null);

  const [isDraggingId, setIsDraggingId] = useState<string | null>(null);
  const lastUpdateRef = useRef<number>(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

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

  // 기본값 생성
  function getDefaultValue(type: FieldType): PostBlock['value'] {
    switch (type) {
      case 'date':
        return formatDateDot(new Date());
      case 'time':
        return formatTime(new Date());
      case 'rating':
        return 0;
      case 'tags':
        return [];
      case 'photos':
        return [];
      case 'table':
        return [
          ['', ''],
          ['', ''],
        ];
      case 'content':
        return '';
      case 'emotion':
        return '';
      case 'location':
        return { address: '' };
      case 'media':
        return { image: '', type: '', title: '', year: '' };
      default:
        return '';
    }
  }

  function normalizeLayout(targetBlocks: PostBlock[]): PostBlock[] {
    let currentRow = 1;
    let currentCol = 1;
    return targetBlocks.map((block) => {
      const span = block.layout.span;
      if (span === 2 && currentCol === 2) {
        currentRow++;
        currentCol = 1;
      }
      const updated = {
        ...block,
        layout: { row: currentRow, col: currentCol, span },
      };
      currentCol += span;
      if (currentCol > 2) {
        currentRow++;
        currentCol = 1;
      }
      return updated as PostBlock;
    });
  }

  const canBeHalfWidth = (type: FieldType) =>
    [
      'date',
      'emotion',
      'location',
      'rating',
      'time',
      'media',
      'content',
      'tags',
    ].includes(type);

  // 필드 값 업데이트 함수
  const updateFieldValue = <T extends PostBlock>(
    id: string,
    value: T['value'],
  ) => {
    setBlocks((prev) =>
      prev.map((b) => (b.id === id ? { ...b, value } : b) as PostBlock),
    );
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
      //TODO : 임시작업. 이후 토스트/모달 등
      //       또는 아래 툴바 막기
      alert(`${type} 필드는 최대 ${limit}개까지만 추가 가능합니다.`);
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

    const drawerTypes: FieldType[] = [
      'date',
      'time',
      'tags',
      'rating',
      'photos',
      'emotion',
      'location',
      'media',
    ];
    if (drawerTypes.includes(type)) {
      setActiveDrawer({ type, id: newId });
    }
  };

  const removeBlock = (id: string) => {
    setBlocks((prev) => normalizeLayout(prev.filter((b) => b.id !== id)));
  };

  const handleDragStart = (id: string) => setIsDraggingId(id);
  const handleDragOver = (e: React.DragEvent, targetId: string) => {
    e.preventDefault();
    if (isDraggingId === targetId) return;
    const now = Date.now();
    if (now - lastUpdateRef.current < 50) return;
    lastUpdateRef.current = now;

    const dragIdx = blocks.findIndex((b) => b.id === isDraggingId);
    const hoverIdx = blocks.findIndex((b) => b.id === targetId);
    if (dragIdx === -1 || hoverIdx === -1) return;

    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    const x = e.clientX - rect.left;
    const draggingBlock = blocks[dragIdx];

    let newSpan = draggingBlock.layout.span;
    if (canBeHalfWidth(draggingBlock.type)) {
      newSpan = x < rect.width * 0.25 || x > rect.width * 0.75 ? 1 : 2;
    }

    if (dragIdx !== hoverIdx || draggingBlock.layout.span !== newSpan) {
      const newBlocks = [...blocks];
      newBlocks[dragIdx].layout.span = newSpan;
      const [draggedItem] = newBlocks.splice(dragIdx, 1);
      newBlocks.splice(hoverIdx, 0, draggedItem);
      setBlocks(normalizeLayout(newBlocks));
    }
  };

  const handleSave = () => {
    const payload = { title, blocks };
    console.log('Save:', payload);
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
            onChange={(v) => updateFieldValue(block.id, v)}
          />
        );
      case 'photos':
        return (
          <PhotoField
            photos={block.value as unknown as string[]}
            onClick={() => setActiveDrawer({ type: 'photos', id: block.id })}
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
                block.id,
                block.value.filter((t) => t !== tag),
              )
            }
            onAdd={() => setActiveDrawer({ type: 'tags', id: block.id })}
          />
        );
      case 'table':
        return (
          <TableField
            data={block.value}
            onUpdate={(d) =>
              d ? updateFieldValue(block.id, d) : removeBlock(block.id)
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
    const { id } = activeDrawer;
    const block = blocks.find((b) => b.id === id);
    if (!block) return null;

    switch (block.type) {
      case 'date':
        return (
          <DateDrawer
            mode="single"
            currentDate={block.value}
            onSelectDate={(d) => {
              updateFieldValue(id, d);
              setActiveDrawer(null);
            }}
            onClose={() => setActiveDrawer(null)}
          />
        );
      case 'time':
        return (
          <TimePickerDrawer
            currentTime={block.value}
            onSave={(t) => {
              updateFieldValue(id, t);
              setActiveDrawer(null);
            }}
            onClose={() => setActiveDrawer(null)}
          />
        );
      case 'tags':
        return (
          <TagDrawer
            onClose={() => setActiveDrawer(null)}
            tags={block.value}
            previousTags={['식단', '운동']}
            onUpdateTags={(nt) => updateFieldValue(id, nt)}
          />
        );
      case 'rating':
        return (
          <RatingDrawer
            rating={{ value: block.value, max: 5 }}
            onUpdateRating={(nr) => {
              updateFieldValue(id, nr.value);
              setActiveDrawer(null);
            }}
            onClose={() => setActiveDrawer(null)}
          />
        );
      case 'photos':
        return (
          <PhotoDrawer
            photos={block.value as unknown as string[]}
            onUploadClick={() => fileInputRef.current?.click()}
            onRemovePhoto={(idx) =>
              updateFieldValue(
                id,
                (block.value as unknown as string[]).filter(
                  (_, i) => i !== idx,
                ),
              )
            }
            onRemoveAll={() => updateFieldValue(id, [])}
            onClose={() => setActiveDrawer(null)}
          />
        );
      case 'emotion':
        return (
          <EmotionDrawer
            isOpen={activeDrawer.type === 'emotion'}
            selectedEmotion={block.value}
            onSelect={(emo) => {
              updateFieldValue(id, emo);
              setActiveDrawer(null);
            }}
            onClose={() => setActiveDrawer(null)}
          />
        );
      case 'location':
        return (
          <LocationDrawer
            mode="post"
            onSelect={(data) => {
              updateFieldValue(id, data);
              setActiveDrawer(null);
            }}
            onClose={() => setActiveDrawer(null)}
          />
        );
      case 'media':
        return (
          <MediaDrawer
            onSelect={(data) => {
              updateFieldValue(id, data);
              setActiveDrawer(null);
            }}
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
        <div className="grid grid-cols-2 gap-x-3 gap-y-5 items-center transition-all duration-300">
          {blocks.map((block) => (
            <div
              key={block.id}
              draggable
              onDragStart={() => handleDragStart(block.id)}
              onDragOver={(e) => handleDragOver(e, block.id)}
              onDragEnd={() => setIsDraggingId(null)}
              className={`relative transition-all duration-300 group/field ${block.layout.span === 1 ? 'col-span-1' : 'col-span-2'} ${isDraggingId === block.id ? 'opacity-20 scale-95' : 'opacity-100'}`}
            >
              <div className="absolute -left-6 top-1/2 -translate-y-1/2 flex items-center justify-center w-6 h-full opacity-0 group-hover/field:opacity-40 transition-opacity cursor-grab active:cursor-grabbing">
                <GripVertical className="w-4 h-4 text-gray-500" />
              </div>
              <div className="w-full">{renderField(block)}</div>
            </div>
          ))}
        </div>
      </main>
      <Toolbar onAddBlock={addOrShowBlock} />

      {/* 복구된 파일 입력 로직 */}
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
              // TODO: toast 변경 예정
              alert(`이미 최대 개수인 ${MAX_PHOTO_COUNT}개를 모두 채웠습니다.`);
              e.target.value = '';
              return;
            }
            //10개 초과 시 10개만 넣기
            const filesToProcess = Array.from(files).slice(0, availableSlots);

            if (files.length > availableSlots) {
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
              // 새로 읽은 사진들 넣기
              updateFieldValue(blockId, [...existingPhotos, ...newImages]);
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
