'use client';

import { useEffect, useState } from 'react';
import { GripVertical } from 'lucide-react';

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
} from '../../_utils/recordLayoutHelper';
import SaveTemplateDrawer from './core/SaveTemplateDrawer';
import LayoutTemplateDrawer from './core/LayoutTemplateDrawer';
import { useRecordEditorDnD } from '../../_hooks/useRecordEditorDnD';
import { usePostEditorBlocks } from '../../_hooks/usePostEditorBlocks';
import { useCreateRecord } from '@/hooks/useCreateRecord';
import { mapBlocksToPayload } from '@/lib/utils/mapBlocksToPayload';
import { useRouter } from 'next/navigation';
import { usePostEditorInitializer } from '../../_hooks/useRecordEditorInitializer';
import Image from 'next/image';
import { useQuery } from '@tanstack/react-query';
import { groupDraftOptions } from '@/lib/api/groupRecord';
import { useDraftPresence } from '@/hooks/useDraftPresence';
import { LockResponsePayload, useLockManager } from '@/hooks/useLockManager';
import { useSocketStore } from '@/store/useSocketStore';

export default function PostEditor({
  mode,
  initialPost,
  groupId,
  draftId,
}: {
  mode: 'add' | 'edit';
  initialPost?: { title: string; blocks: RecordBlock[] };
  groupId?: string;
  draftId?: string;
}) {
  const router = useRouter();

  const [title, setTitle] = useState(initialPost?.title ?? '');
  const { mutate: createRecord } = useCreateRecord();
  const { socket, sessionId: mySessionId } = useSocketStore();
  const [locks, setLocks] = useState<Record<string, string>>({});
  const { requestLock, releaseLock, pendingLockKey, setPendingLockKey } =
    useLockManager(draftId);

  //TODO: 이후 활성화된 블록에 유저 정보 보여주는용
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [isActive, setIsActive] = useState(false);

  //TODO: 임시 클라이언트 호출
  const { data: remoteData } = useQuery({
    ...groupDraftOptions(groupId ?? '', draftId ?? ''),
    enabled: !!groupId && !!draftId,
  });

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
  } = usePostEditorBlocks({
    draftId,
    requestLock,
    releaseLock,
  });

  const {
    gridRef,
    isDraggingId,
    setIsDraggingId,
    handleDragStart,
    handleDragOver,
    handleGridDragOver,
  } = useRecordEditorDnD(blocks, setBlocks, canBeHalfWidth);

  // 페이지 초기화/복구 및 위치 데이터 받기
  // TODO: 이후 키 형태/서버 패칭으로 변경
  const resolvedInitialPost = remoteData
    ? { title: remoteData.snapshot.title, blocks: remoteData.snapshot.blocks }
    : initialPost;

  // 에디터 초기화
  usePostEditorInitializer({
    initialPost: resolvedInitialPost,
    onInitialized: ({ title, blocks }) => {
      setTitle(title);
      setBlocks(blocks);
    },
  });

  const { members } = useDraftPresence(draftId);

  // 서버의 LOCK_CHANGED 브로드캐스트 수신
  useEffect(() => {
    if (!socket) return;
    socket.on(
      'LOCK_CHANGED',
      ({ lockKey, ownerSessionId }: LockResponsePayload) => {
        setLocks((prev) => {
          const newLocks = { ...prev };

          if (ownerSessionId) {
            // 소유자가 있으면 새로운 락 추가
            newLocks[lockKey] = ownerSessionId;
          } else {
            // 소유자가 없으면 락 해제 = 해당 키 삭제
            delete newLocks[lockKey];
          }
          return newLocks;
        });

        // 기다리던 락이 승인되었다면 드로어 오픈
        if (pendingLockKey === lockKey && ownerSessionId === mySessionId) {
          //setActiveDrawer({ type: '', id: lockKey });
          setPendingLockKey(null);
        }
      },
    );
    return () => {
      socket.off('LOCK_CHANGED');
    };
  }, [socket, pendingLockKey, mySessionId, setPendingLockKey]);

  const goToLocationPicker = () => {
    sessionStorage.setItem('editor_draft', JSON.stringify({ title, blocks }));
    router.push('/location-picker');
  };

  const handleSave = () => {
    const payload = {
      scope: 'PERSONAL',
      title,
      blocks: mapBlocksToPayload(blocks),
    };
    createRecord(payload);
  };

  const renderField = (block: RecordBlock) => {
    const lockKey = `block:${block.id}`;
    const ownerSessionId = locks[lockKey];
    const isLockedByOther = !!ownerSessionId && ownerSessionId !== mySessionId;

    const handleFocus = () => {
      if (draftId) requestLock(lockKey);
    };

    const handleBlur = () => {
      if (draftId) releaseLock(lockKey);
    };

    const handleLockAndAction = () => {
      if (isLockedByOther) return;
      if (draftId) requestLock(lockKey);

      // 위치(location)만 페이지 이동이고, 나머지는 모두 드로어 오픈
      if (block.type === 'location') {
        goToLocationPicker();
      } else {
        setActiveDrawer({ type: block.type, id: block.id });
      }
    };

    switch (block.type) {
      case 'date':
        return (
          <DateField date={block.value.date} onClick={handleLockAndAction} />
        );
      case 'time':
        return (
          <TimeField time={block.value.time} onClick={handleLockAndAction} />
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
            isLocked={isLockedByOther}
            onFocus={handleFocus}
            onBlur={handleBlur}
          />
        );
      case 'photos':
        return (
          <PhotoField
            photos={block.value as PhotoValue}
            onClick={handleLockAndAction}
            onRemove={() => removeBlock(block.id)}
          />
        );
      case 'emotion':
        return (
          <EmotionField
            emotion={block.value.mood}
            onClick={handleLockAndAction}
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
            onAdd={handleLockAndAction}
            onRemoveField={() => removeBlock(block.id)}
          />
        );
      case 'table':
        return (
          <TableField
            data={block.value}
            onUpdate={(d) => {
              if (d) {
                updateFieldValue(d, block.id);
              } else {
                removeBlock(block.id);
              }
            }}
            isLocked={isLockedByOther}
            onFocus={handleFocus}
            onBlur={handleBlur}
          />
        );
      case 'rating':
        return (
          <RatingField
            value={block.value.rating}
            max={5}
            onClick={handleLockAndAction}
            onRemove={() => removeBlock(block.id)}
          />
        );
      case 'location':
        return (
          <LocationField
            location={block.value}
            onClick={() => goToLocationPicker()}
            onRemove={() => removeBlock(block.id)}
          />
        );
      case 'media':
        return (
          <MediaField
            data={block.value as MediaValue}
            onClick={handleLockAndAction}
            onRemove={() => removeBlock(block.id)}
          />
        );
      default:
        return null;
    }
  };
  const handleCloseDrawer = (id?: string) => {
    if (id && draftId) {
      const lockKey = `block:${id}`;
      releaseLock(lockKey);
    }
    setActiveDrawer(null);
    return;
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
            onClose={() => handleCloseDrawer(id)}
          />
        );
      case 'time':
        return (
          <TimePickerDrawer
            currentTime={initialValue as TimeValue}
            onSave={(v) => handleDone({ time: v })}
            onClose={() => handleCloseDrawer(id)}
          />
        );
      case 'tags':
        return (
          <TagDrawer
            onClose={() => handleCloseDrawer(id)}
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
            onClose={() => handleCloseDrawer(id)}
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
            onClose={() => handleCloseDrawer(id)}
          />
        );
      case 'emotion':
        return (
          <EmotionDrawer
            isOpen={true}
            selectedEmotion={initialValue as string}
            onSelect={(v) => handleDone({ mood: v })}
            onClose={() => handleCloseDrawer(id)}
          />
        );
      case 'media':
        return (
          <MediaDrawer
            onSelect={handleDone}
            onClose={() => handleCloseDrawer(id)}
          />
        );
      default:
        return null;
    }
  };

  // location 분기처리를 위한 Toolbar 전달용 핸들러
  const handleToolbarAddBlock = (type: FieldType) => {
    if (type === 'location') {
      goToLocationPicker();
    } else {
      addOrShowBlock(type);
    }
  };
  return (
    <div className="w-full flex flex-col min-h-screen bg-white dark:bg-[#121212]">
      <RecordEditorHeader mode={mode} onSave={handleSave} members={members} />
      <main className="px-6 py-6 space-y-8 pb-48 overflow-y-auto">
        <RecordTitleInput value={title} onChange={setTitle} />
        <div
          ref={gridRef}
          onDragOver={handleGridDragOver}
          className="grid grid-cols-2 gap-x-3 gap-y-5 items-center transition-all duration-300"
        >
          {blocks.map((block) => {
            const lockKey = `block:${block.id}`;
            const ownerSessionId = locks[lockKey];
            const owner = members.find((m) => m.sessionId === ownerSessionId);

            //const isLockedByOther = ownerSessionId && ownerSessionId !== mySessionId;
            return (
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

                <div className="w-full flex flex-row gap-2 items-center">
                  {owner && (
                    <Image
                      src="/profile-ex.jpeg"
                      className="w-6 h-6 rounded-full"
                      width={8}
                      height={8}
                      alt="현재 유저 프로필"
                    />
                  )}
                  {renderField(block)}
                </div>
              </div>
            );
          })}
        </div>
      </main>
      <Toolbar
        onAddBlock={handleToolbarAddBlock}
        onOpenDrawer={setActiveDrawer}
      />

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
