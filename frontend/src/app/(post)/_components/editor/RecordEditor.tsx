'use client';

import { useEffect, useState, useRef } from 'react';
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
import MetadataSelectionDrawer from './metadata/MetadataSelectionDrawer';

// 타입
import {
  BlockValue,
  CreateRecordRequest,
  FieldType,
  MoodValue,
  RatingValue,
  RecordScope,
  TagValue,
  TimeValue,
} from '@/lib/types/record';
import { RecordBlock } from '@/lib/types/recordField';
import {
  canBeHalfWidth,
  getDefaultValue,
  isRecordBlockEmpty,
  validateAndCleanRecord,
} from '../../_utils/recordLayoutHelper';
import SaveTemplateDrawer from './core/SaveTemplateDrawer';
import LayoutTemplateDrawer from './core/LayoutTemplateDrawer';
import { useRecordEditorDnD } from '../../_hooks/useRecordEditorDnD';
import { usePostEditorBlocks } from '../../_hooks/usePostEditorBlocks';
import { useCreateRecord } from '@/hooks/useCreateRecord';
import { mapBlocksToPayload } from '@/lib/utils/mapBlocksToPayload';

import { usePostEditorInitializer } from '../../_hooks/useRecordEditorInitializer';
import { useDraftPresence } from '@/hooks/useDraftPresence';
import { LockResponsePayload, useLockManager } from '@/hooks/useLockManager';
import { useSocketStore } from '@/store/useSocketStore';
import { useRecordCollaboration } from '@/hooks/useRecordCollaboration';
import { useThrottle } from '@/lib/utils/useThrottle';
import { RecordFieldRenderer } from './RecordFieldRender';
import AuthLoadingScreen from '@/components/AuthLoadingScreen';
import { useRecordEditorPhotos } from '../../_hooks/useRecordEditorPhotos';
import { useMediaUpload } from '@/hooks/useMediaUpload';
import { useQueryClient } from '@tanstack/react-query';
import { refreshGroupData } from '@/lib/actions/revalidate';
import AssetImage from '@/components/AssetImage';
import Image from 'next/image';
import LocationDrawer from '@/components/map/LocationDrawer';
import { toast } from 'sonner';

interface PostEditorProps {
  mode: 'add' | 'edit';
  initialPost?: { title: string; blocks: RecordBlock[]; version?: number };
  draftId?: string;
  groupId?: string;
  postId?: string;
}

export default function PostEditor({
  mode,
  initialPost,
  draftId,
  groupId,
  postId,
}: PostEditorProps) {
  const queryClient = useQueryClient();
  const [title, setTitle] = useState(initialPost?.title ?? '');
  const [blocks, setBlocks] = useState<RecordBlock[]>([]);

  const { socket, sessionId: mySessionId } = useSocketStore();
  const [locks, setLocks] = useState<Record<string, string>>({});
  const { requestLock, releaseLock } = useLockManager(draftId);
  const { uploadMultipleMedia, isUploading: isMediaUploading } =
    useMediaUpload();

  const {
    streamingValues,
    emitStream,
    applyPatch,
    versionRef,
    isPublishing,
    setIsPublishing,
  } = useRecordCollaboration(
    draftId,
    setBlocks,
    setTitle,
    initialPost?.version, // 초기 버전 주입
  );
  const { execute } = useCreateRecord(groupId, postId, {
    onError: () => {
      setIsPublishing(false);
    },
  });

  const {
    activeDrawer,
    setActiveDrawer,
    fileInputRef,
    updateFieldValue,
    handleDone,
    addOrShowBlock,
    removeBlock,
    handleApplyTemplate,
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

  const {
    pendingMetadata,
    pendingFilesRef,
    handlePhotoUpload,
    handleApplyMetadata,
    handleSkipMetadata,
    handleEditMetadata,
  } = useRecordEditorPhotos({
    blocks,
    setBlocks,
    activeDrawer,
    setActiveDrawer,
    handleDone,
    draftId,
    uploadMultipleMedia,
    applyPatch,
    releaseLock,
  });

  const {
    gridRef,
    isDraggingId,
    handleGridDragOver,
    handleDragEnd,
    handlePointerDown,
    handlePointerMove,
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
  });

  // draftId가 있지만 initialPost가 없는 경우 처리
  // (발행 직후 또는 잘못된 draft ID)
  useEffect(() => {
    if (!draftId || initialPost || !groupId) return;

    // DRAFT_PUBLISHED 이벤트를 일정 시간 기다림
    const timer = setTimeout(() => {
      // 이벤트가 오지 않으면 실제로 draft가 없는 것
      // 그룹 페이지로 리다이렉트
      toast.error('기록을 찾을 수 없습니다.');
      window.location.href = `/group/${groupId}`;
    }, 3000);

    return () => clearTimeout(timer);
  }, [draftId, initialPost, groupId]);

  const { members } = useDraftPresence(draftId, groupId);

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

  // 메타데이터 선택 drawer가 열릴 때 필드 락 요청
  const metadataLocksRef = useRef<string[]>([]);

  useEffect(() => {
    if (!draftId) return;

    // drawer가 열릴 때 락 요청
    if (pendingMetadata?.images.length) {
      const locksToRequest: string[] = [];

      // 날짜 블록 락 확인 및 요청
      const dateBlock = blocks.find((b) => b.type === 'date');
      if (dateBlock) {
        const lockKey = `block:${dateBlock.id}`;
        const ownerSessionId = locks[lockKey];
        const isLockedByOther =
          !!ownerSessionId && ownerSessionId !== mySessionId;

        if (!isLockedByOther) {
          requestLock(lockKey);
          locksToRequest.push(lockKey);
        }
      }

      // 시간 블록 락 확인 및 요청
      const timeBlock = blocks.find((b) => b.type === 'time');
      if (timeBlock) {
        const lockKey = `block:${timeBlock.id}`;
        const ownerSessionId = locks[lockKey];
        const isLockedByOther =
          !!ownerSessionId && ownerSessionId !== mySessionId;

        if (!isLockedByOther) {
          requestLock(lockKey);
          locksToRequest.push(lockKey);
        }
      }

      // 위치 블록 락 확인 및 요청
      const locationBlock = blocks.find((b) => b.type === 'location');
      if (locationBlock) {
        const lockKey = `block:${locationBlock.id}`;
        const ownerSessionId = locks[lockKey];
        const isLockedByOther =
          !!ownerSessionId && ownerSessionId !== mySessionId;

        if (!isLockedByOther) {
          requestLock(lockKey);
          locksToRequest.push(lockKey);
        }
      }

      metadataLocksRef.current = locksToRequest;
    }

    // cleanup: drawer가 닫힐 때 또는 컴포넌트가 unmount될 때 락 해제
    return () => {
      metadataLocksRef.current.forEach((lockKey) => {
        releaseLock(lockKey);
      });
      metadataLocksRef.current = [];
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pendingMetadata?.images.length, draftId]);

  const handleSave = async () => {
    // 이미 발행 중이면 중복 요청 무시
    if (isPublishing) {
      return;
    }

    const { isValid, message, filteredBlocks } = validateAndCleanRecord(
      title,
      blocks,
    );

    if (!isValid) {
      toast.error(message);
      return;
    }
    const scope = (groupId ? 'GROUP' : 'PERSONAL') as RecordScope;
    const isDraft = !!draftId;

    if (groupId && draftId) {
      execute({
        draftId,
        draftVersion: versionRef.current,
      });
      await refreshGroupData(groupId);
      queryClient.invalidateQueries({ queryKey: ['group', groupId] });
      return;
    }

    if (groupId) {
      await refreshGroupData(groupId);
      queryClient.invalidateQueries({ queryKey: ['group', groupId] });
    }

    // 개인용 게시글 이미지 -> id 변환 로직
    const finalizedBlocks = await Promise.all(
      filteredBlocks.map(async (block) => {
        if (block.type === 'photos') {
          const tempUrls = block.value.tempUrls || [];
          const filesToUpload: File[] = [];

          // Ref에서 실제 파일 매칭
          tempUrls.forEach((url) => {
            const file = pendingFilesRef.current.get(url);
            if (file) filesToUpload.push(file);
          });

          if (filesToUpload.length > 0) {
            const newMediaIds = await uploadMultipleMedia(filesToUpload);
            const updatedValue = {
              mediaIds: [...(block.value.mediaIds || []), ...newMediaIds],
              tempUrls: [], // 업로드 완료 후 비움
            };

            return { ...block, value: updatedValue };
          }
        }
        return block;
      }),
    );

    // 빈 photos 블록 필터링 (mediaIds와 tempUrls가 모두 비어있는 경우 제거)
    const validBlocks = finalizedBlocks.filter((block) => {
      if (block.type === 'photos') {
        const mediaIds = block.value.mediaIds || [];
        const tempUrls = block.value.tempUrls || [];
        return mediaIds.length > 0 || tempUrls.length > 0;
      }
      return true;
    });

    const postPayload: CreateRecordRequest = {
      title,
      blocks: mapBlocksToPayload(validBlocks, isDraft),
      ...(groupId ? { groupId } : {}),
      ...(!postId ? { scope } : {}),
    };

    queryClient.invalidateQueries({ queryKey: ['my', 'records'] });
    execute({
      payload: postPayload,
    });
  };

  const throttledEmitStream = useThrottle(
    (blockId: string, newValue: BlockValue) => {
      if (draftId) emitStream(blockId, newValue);
    },
    3000,
  ); // 3초 간격

  const handleFieldUpdate = (
    blockId: string,
    newValue: BlockValue,
    shouldStream: boolean = true,
  ) => {
    // 내 화면 업데이트
    updateFieldValue(newValue, blockId);

    // 다른 사람 스트리밍
    if (shouldStream) {
      throttledEmitStream(blockId, newValue);
    }
  };

  // 공통 커밋 함수
  const handleFieldCommit = (id: string, value: BlockValue) => {
    if (!draftId) return;
    if (isRecordBlockEmpty(value)) {
      return;
    }
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
  const handleCloseDrawer = (id?: string, finalValue?: BlockValue) => {
    if (!id) {
      setActiveDrawer(null);
      return;
    }

    const currentBlock = blocks.find((b) => b.id === id);
    if (!currentBlock) {
      setActiveDrawer(null);
      return;
    }
    const valueToCommit = finalValue || currentBlock.value;
    const isEmpty = isRecordBlockEmpty(valueToCommit);
    if (isEmpty) {
      // 값이 비어있다면 블록 삭제
      removeBlock(id);
    } else if (draftId) {
      if (currentBlock) {
        // 값이 있으면 최종 커밋
        applyPatch({
          type: 'BLOCK_SET_VALUE',
          blockId: id,
          value: finalValue || currentBlock.value,
        });
      }

      // 어떤 경우든 락 해제
      releaseLock(`block:${id}`);
    }

    setActiveDrawer(null);
  };

  // 선택과 동시에 커밋되도록 하는 드로어
  const handleImmediateCommit = (newValue: BlockValue) => {
    if (!activeDrawer) return;
    const id = updateFieldValue(
      newValue,
      activeDrawer.id,
      activeDrawer.type as FieldType,
    );

    if (!id) return;
    if (draftId) {
      applyPatch({
        type: 'BLOCK_SET_VALUE',
        blockId: id,
        value: newValue,
      });

      releaseLock(`block:${id}`);
    }

    setActiveDrawer(null);
  };

  const renderActiveDrawer = () => {
    if (!activeDrawer) return null;
    const { type, id } = activeDrawer;

    // if (type === 'layout') {
    //   return (
    //     <LayoutTemplateDrawer
    //       isOpen={true}
    //       onClose={() => setActiveDrawer(null)}
    //       customTemplates={[]} //TODO: 커스텀 필드 관련 데이터
    //       onSelect={handleApplyTemplate}
    //     />
    //   );
    // }

    // if (type === 'saveLayout') {
    //   return (
    //     <SaveTemplateDrawer
    //       isOpen={true}
    //       onClose={() => setActiveDrawer(null)}
    //       onSave={() => {}} // TODO: 사용자 맞춤 템플릿 저장 로직
    //     />
    //   );
    // }

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
            onSelectDate={(v) => handleImmediateCommit({ date: v })}
            onClose={() => handleCloseDrawer(id)}
          />
        );
      case 'time':
        return (
          <TimePickerDrawer
            currentTime={initialValue as TimeValue}
            onSave={(v) => handleImmediateCommit({ time: v })}
            onClose={() => handleCloseDrawer(id)}
          />
        );
      case 'tags':
        return (
          <TagDrawer
            onClose={() => handleCloseDrawer(id)}
            tags={initialValue as TagValue}
            onUpdateTags={(nt) => handleDrawerDone({ tags: nt })}
          />
        );
      case 'rating':
        return (
          <RatingDrawer
            rating={initialValue as RatingValue}
            onUpdateRating={(nr) => handleDrawerDone({ rating: nr.rating })}
            onClose={(v) => handleCloseDrawer(id, v)}
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
            onEditMetadata={handleEditMetadata}
            appliedMetadata={pendingMetadata?.appliedMetadata || {}}
            onClose={() => {
              handleCloseDrawer(id);
            }}
            draftId={draftId}
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
              //handleDrawerDone(v);
              handleImmediateCommit(v);
            }}
            onClose={() => handleCloseDrawer(id)}
          />
        );
      case 'location':
        return (
          <LocationDrawer
            isOpen={true}
            onSelect={(v) => handleImmediateCommit(v)} // 선택 시 바로 커밋하고 닫힘
            onClose={() => handleCloseDrawer(id)}
          />
        );
      default:
        return null;
    }
  };

  // Toolbar 전달용 핸들러
  const handleToolbarAddBlock = (type: FieldType) => {
    addOrShowBlock(type);
  };

  return (
    <div className="w-full flex flex-col h-full bg-white dark:bg-[#121212]">
      {(isPublishing || (isMediaUploading && !draftId)) && (
        <AuthLoadingScreen type="publish" className="fixed inset-0 z-[9999]" />
      )}
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
          className={`grid grid-cols-2 gap-x-3 gap-y-5 items-center pr-3 ${
            isDraggingId ? '' : 'transition-all duration-300'
          }`}
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
                data-block-id={block.id}
                key={block.id}
                className={`cursor-grab touch-none relative group/field ${block.layout.span === 1 ? 'col-span-1' : 'col-span-2'} ${isDraggingId === block.id ? 'opacity-20 scale-95 pointer-events-none' : 'opacity-100'} ${!isDraggingId ? 'transition-all duration-300' : ''}`}
              >
                <div
                  className={`relative w-full flex flex-row gap-2 items-center ${
                    block.layout.col === 1 ? 'justify-start' : 'justify-end'
                  }`}
                >
                  {isLockedByOther && owner && (
                    <div>
                      {owner.profileImageId ? (
                        <AssetImage
                          assetId={owner.profileImageId}
                          alt={`${owner.displayName} 편집 중`}
                          width={24}
                          height={24}
                          className="w-6 h-6 rounded-full ring-2 ring-itta-point animate-pulse"
                          title={owner.displayName}
                        />
                      ) : (
                        <Image
                          width={24}
                          height={24}
                          src={'/profile_base.png'}
                          alt={`${owner.displayName} 편집 중`}
                          className="w-6 h-6 rounded-full ring-2 ring-itta-point animate-pulse"
                        />
                      )}
                    </div>
                  )}
                  <div
                    onPointerDown={(e) => handlePointerDown(e, block.id)}
                    onPointerMove={(e) => handlePointerMove(e)}
                    onPointerUp={handleDragEnd}
                    className="flex items-center justify-center w-6 h-full opacity-30 transition-opacity cursor-grab active:cursor-grabbing"
                  >
                    <GripVertical className="w-4 h-4 text-gray-500 dark:text-gray-200" />
                  </div>
                  <RecordFieldRenderer
                    block={block}
                    streamingValue={streamingValues[block.id]}
                    requestLock={requestLock}
                    onUpdate={handleFieldUpdate}
                    onCommit={handleFieldCommit}
                    onRemove={removeBlock}
                    onOpenDrawer={(type, id) => setActiveDrawer({ type, id })}
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
        accept="image/jpeg, image/jpg, image/png, image/webp"
        onChange={handlePhotoUpload}
      />
      {renderActiveDrawer()}

      {/* 메타데이터 선택 드로어 */}
      {pendingMetadata && pendingMetadata.images.length > 0 && (
        <MetadataSelectionDrawer
          isOpen={true}
          onClose={handleSkipMetadata}
          images={pendingMetadata.images}
          onApplyMetadata={handleApplyMetadata}
          lockedFields={{
            date: (() => {
              const dateBlock = blocks.find((b) => b.type === 'date');
              if (!dateBlock) return false;
              const lockKey = `block:${dateBlock.id}`;
              const ownerSessionId = locks[lockKey];
              return !!ownerSessionId && ownerSessionId !== mySessionId;
            })(),
            time: (() => {
              const timeBlock = blocks.find((b) => b.type === 'time');
              if (!timeBlock) return false;
              const lockKey = `block:${timeBlock.id}`;
              const ownerSessionId = locks[lockKey];
              return !!ownerSessionId && ownerSessionId !== mySessionId;
            })(),
            location: (() => {
              const locationBlock = blocks.find((b) => b.type === 'location');
              if (!locationBlock) return false;
              const lockKey = `block:${locationBlock.id}`;
              const ownerSessionId = locks[lockKey];
              return !!ownerSessionId && ownerSessionId !== mySessionId;
            })(),
          }}
        />
      )}
    </div>
  );
}
