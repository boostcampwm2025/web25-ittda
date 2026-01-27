'use client';

import { useEffect, useState } from 'react';
import { GripVertical } from 'lucide-react';

// 컴포넌트 및 필드 임포트
import RecordEditorHeader from './RecordEditorHeader';
import RecordTitleInput from './RecordTitleInput';
import Toolbar from './Toolbar';

// 드로어
import DateDrawer from '@/components/DateDrawer';
import TimePickerDrawer from './core/TimePickerDrawer';
import TagDrawer from './tag/TagDrawer';
import RatingDrawer from './rating/RatingPickerDrawer';
import PhotoDrawer from './photo/PhotoDrawer';
import EmotionDrawer from './emotion/EmotionDrawer';
import MediaDrawer from './media/MediaDrawer';

// 타입
import {
  BlockValue,
  FieldType,
  LocationValue,
  MoodValue,
  RatingValue,
  TagValue,
  TimeValue,
} from '@/lib/types/record';
import { RecordBlock } from '@/lib/types/recordField';
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
import { useDraftPresence } from '@/hooks/useDraftPresence';
import { LockResponsePayload, useLockManager } from '@/hooks/useLockManager';
import { useSocketStore } from '@/store/useSocketStore';
import { useRecordCollaboration } from '@/hooks/useRecordCollaboration';
import { useThrottle } from '@/lib/utils/useThrottle';
import { RecordFieldRenderer } from './RecordFieldRender';

export default function PostEditor({
  mode,
  initialPost,
  draftId,
  groupId,
}: {
  mode: 'add' | 'edit';
  initialPost?: { title: string; blocks: RecordBlock[]; version?: number };
  groupId?: string;
  draftId?: string;
}) {
  const router = useRouter();

  const [title, setTitle] = useState(initialPost?.title ?? '');
  const [blocks, setBlocks] = useState<RecordBlock[]>([]);
  const { mutate: createRecord } = useCreateRecord();
  const { socket, sessionId: mySessionId } = useSocketStore();
  const [locks, setLocks] = useState<Record<string, string>>({});
  const { requestLock, releaseLock } = useLockManager(draftId);

  const { streamingValues, emitStream, applyPatch } = useRecordCollaboration(
    draftId,
    setBlocks,
    setTitle,
    initialPost?.version, // 초기 버전 주입
  );

  const {
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
    blocks,
    setBlocks,
    draftId,
    mySessionId: mySessionId || undefined,
    locks,
    requestLock,
    releaseLock,
    applyPatch,
  });

  const handleLocationUpdate = (locationData: LocationValue) => {
    const existingBlock = blocks.find((b) => b.type === 'location');

    if (existingBlock) {
      // 블록이 이미 있으면 업데이트 후 커밋 + 락 해제
      updateFieldValue(locationData, existingBlock.id);

      if (draftId) {
        applyPatch({
          type: 'BLOCK_SET_VALUE',
          blockId: existingBlock.id,
          value: locationData,
        });
        releaseLock(`block:${existingBlock.id}`);
      }
    } else {
      addOrShowBlock('location', locationData);
    }

    // 세션 스토리지 정리
    sessionStorage.removeItem('selected_location');
  };

  const {
    gridRef,
    isDraggingId,
    handleDragStart,
    handleDragOver,
    handleGridDragOver,
    handleDragEnd,
  } = useRecordEditorDnD(
    blocks,
    setBlocks,
    canBeHalfWidth,
    applyPatch,
    draftId,
  );

  // 페이지 초기화/복구 및 위치 데이터 받기
  const resolvedInitialPost = initialPost
    ? { title: initialPost?.title, blocks: initialPost?.blocks }
    : undefined;

  // 에디터 초기화
  usePostEditorInitializer({
    initialPost: resolvedInitialPost,
    onInitialized: ({ title, blocks }) => {
      setTitle(title);
      setBlocks(blocks);
    },
    onLocationUpdate: handleLocationUpdate,
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
      },
    );
    return () => {
      socket.off('LOCK_CHANGED');
    };
  }, [socket, mySessionId]);

  const goToLocationPicker = () => {
    sessionStorage.setItem('editor_draft', JSON.stringify({ title, blocks }));
    router.push('/location-picker');
  };

  const handleSave = () => {
    //개인 기록 저장만 보장
    //TODO: 그룹 기록 저장
    const scope = draftId ? 'GROUP' : 'PERSONAL';
    const payload = {
      scope: scope,
      title,
      groupId: groupId,
      blocks: mapBlocksToPayload(blocks),
    };
    createRecord(payload);
  };

  const throttledEmitStream = useThrottle(
    (blockId: string, newValue: BlockValue) => {
      if (draftId) emitStream(blockId, newValue);
    },
    3000,
  ); // 3초 간격

  const handleFieldUpdate = (blockId: string, newValue: BlockValue) => {
    // 내 화면 업데이트
    updateFieldValue(newValue, blockId);

    // 다른 사람 스트리밍
    throttledEmitStream(blockId, newValue);
  };

  // 공통 커밋 함수
  const handleFieldCommit = (id: string, value: BlockValue) => {
    if (!draftId) return;

    const lockKey = `block:${id}`;
    const ownerSessionId = locks[lockKey];

    // 내가 락을 갖고있는지 확인
    const isMine = ownerSessionId === mySessionId;

    // 없으면 락 먼저 받기
    if (!isMine) {
      requestLock(lockKey);
    }
    applyPatch({
      type: 'BLOCK_SET_VALUE',
      blockId: id,
      value: value,
    });
    releaseLock(lockKey);
  };

  const handleDrawerDone = (newValue: BlockValue) => {
    if (!activeDrawer) return;
    if (activeDrawer.id && draftId) {
      emitStream(activeDrawer.id, newValue);
    }

    //ID 없을 때 생성 및 락 획득
    handleDone(newValue);
  };

  // 명시적으로 드로어를 닫을 때
  const handleCloseDrawer = (id?: string) => {
    if (id && draftId) {
      const currentBlock = blocks.find((b) => b.id === id);

      //여기서 커밋하기
      if (currentBlock) {
        applyPatch({
          type: 'BLOCK_SET_VALUE',
          blockId: id,
          value: currentBlock.value,
        });
      }

      // 락 해제
      releaseLock(`block:${id}`);
    }

    setActiveDrawer(null);
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
            onSelectDate={(v) => handleDrawerDone({ date: v })}
            onClose={() => handleCloseDrawer(id)}
          />
        );
      case 'time':
        return (
          <TimePickerDrawer
            currentTime={initialValue as TimeValue}
            onSave={(v) => handleDrawerDone({ time: v })}
            onClose={() => handleCloseDrawer(id)}
          />
        );
      case 'tags':
        return (
          <TagDrawer
            onClose={() => handleCloseDrawer(id)}
            tags={initialValue as TagValue}
            previousTags={['식단', '운동']} //TODO: 실제 최근 사용 태그 리스트
            onUpdateTags={(nt) => handleDrawerDone({ tags: nt })}
          />
        );
      case 'rating':
        return (
          <RatingDrawer
            rating={initialValue as RatingValue}
            onUpdateRating={(nr) => handleDrawerDone({ rating: nr.rating })}
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
              else handleDrawerDone(nextValue);
            }}
            onRemoveAll={() => {
              const emptyValue = { mediaIds: [], tempUrls: [] };
              if (id) updateFieldValue(emptyValue, id);
              else handleDrawerDone(emptyValue);
            }}
            onClose={() => handleCloseDrawer(id)}
          />
        );
      case 'emotion':
        return (
          <EmotionDrawer
            isOpen={true}
            selectedEmotion={initialValue as MoodValue}
            onSelect={(v) => handleDrawerDone({ mood: v })}
            onClose={() => handleCloseDrawer(id)}
          />
        );
      case 'media':
        return (
          <MediaDrawer
            onSelect={(v) => {
              handleDrawerDone(v);
            }}
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
        <RecordTitleInput
          title={title}
          setTitle={setTitle}
          draftId={draftId}
          mySessionId={mySessionId}
          members={members}
          applyPatch={applyPatch}
          lockManager={{ locks, requestLock, releaseLock }}
        />
        <div
          ref={gridRef}
          onDragOver={handleGridDragOver}
          className="grid grid-cols-2 gap-x-3 gap-y-5 items-center transition-all duration-300"
        >
          {blocks.map((block) => {
            const lockKey = `block:${block.id}`;
            const ownerSessionId = locks[lockKey];

            const isMyLock = !!ownerSessionId && ownerSessionId === mySessionId;
            const isLockedByOther = !!ownerSessionId && !isMyLock;

            const owner = members.find((m) => m.sessionId === ownerSessionId);

            const contentBlockCount = blocks.filter(
              (b) => b.type === 'content',
            ).length;
            const isLastContentBlock = contentBlockCount === 1;
            return (
              <div
                key={block.id}
                draggable
                onDragStart={() => handleDragStart(block.id)}
                onDragOver={(e) => handleDragOver(e, block.id)}
                onDragEnd={handleDragEnd}
                className={`relative transition-all duration-300 group/field ${block.layout.span === 1 ? 'col-span-1' : 'col-span-2'} ${isDraggingId === block.id ? 'opacity-20 scale-95' : 'opacity-100'}`}
              >
                <div className="absolute -left-6 top-1/2 -translate-y-1/2 flex items-center justify-center w-6 h-full opacity-30 transition-opacity cursor-grab active:cursor-grabbing">
                  <GripVertical className="w-4 h-4 text-gray-500" />
                </div>

                <div className="w-full flex flex-row gap-2 items-center">
                  {isLockedByOther && owner && (
                    <div>
                      <Image
                        src="/profile-ex.jpeg"
                        className="w-6 h-6 rounded-full ring-2 ring-itta-point animate-pulse"
                        width={24}
                        height={24}
                        alt={`${owner.displayName} 편집 중`}
                        title={owner.displayName}
                      />
                    </div>
                  )}
                  <RecordFieldRenderer
                    block={block}
                    streamingValue={streamingValues[block.id]}
                    requestLock={requestLock}
                    onUpdate={handleFieldUpdate}
                    onCommit={handleFieldCommit}
                    onRemove={removeBlock}
                    onOpenDrawer={(type, id) => setActiveDrawer({ type, id })}
                    goToLocationPicker={goToLocationPicker}
                    isLastContentBlock={isLastContentBlock}
                    lock={{
                      lockKey,
                      isMyLock,
                      isLockedByOther,
                    }}
                  />
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
