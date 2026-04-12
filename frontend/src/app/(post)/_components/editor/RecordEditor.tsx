'use client';

import { useEffect, useState, useRef, useCallback, memo, useMemo } from 'react';
import { GripVertical, User } from 'lucide-react';

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
// import SaveTemplateDrawer from './core/SaveTemplateDrawer';
// import LayoutTemplateDrawer from './core/LayoutTemplateDrawer';
import { useRecordEditorDnD } from '../../_hooks/useRecordEditorDnD';
import { usePostEditorBlocks } from '../../_hooks/usePostEditorBlocks';
import { useCreateRecord } from '@/hooks/useCreateRecord';
import {
  mapBlocksToPayload,
  RecordFieldtypeMap,
} from '@/lib/utils/mapBlocksToPayload';

import { usePostEditorInitializer } from '../../_hooks/useRecordEditorInitializer';
import { useDraftPresence, PresenceMember } from '@/hooks/useDraftPresence';
import { LockResponsePayload, useLockManager } from '@/hooks/useLockManager';
import { useSocketStore } from '@/store/useSocketStore';
import { useRecordCollaboration } from '@/hooks/useRecordCollaboration';
import { useThrottle } from '@/lib/utils/useThrottle';
import { RecordFieldRenderer } from './RecordFieldRender';
import AuthLoadingScreen from '@/components/AuthLoadingScreen';
import { useRecordEditorPhotos } from '../../_hooks/useRecordEditorPhotos';
import { useMediaUpload } from '@/hooks/useMediaUpload';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { refreshGroupData } from '@/lib/actions/revalidate';
import AssetImage from '@/components/AssetImage';
import Image from 'next/image';
import LocationDrawer from '@/components/map/LocationDrawer';
import { toast } from 'sonner';
import { groupDetailOptions } from '@/lib/api/group';
import { cn } from '@/lib/utils';

interface PostEditorProps {
  mode: 'add' | 'edit';
  initialPost?: { title: string; blocks: RecordBlock[]; version?: number };
  draftId?: string;
  groupId?: string;
  postId?: string;
  initialDate?: string;
}

// 개별 블록 아이템 컴포넌트 - 콜백 최적화
const BlockItem = memo(function BlockItem({
  block,
  isDraggingId,
  locks,
  mySessionId,
  members,
  streamingValues,
  requestLock,
  handleFieldUpdate,
  handleFieldCommit,
  removeBlock,
  onOpenDrawer,
  contentBlockCount,
  handleDragEnd,
}: {
  block: RecordBlock;
  isDraggingId: string | null;
  locks: Record<string, string>;
  mySessionId: string | null;
  members: PresenceMember[];
  streamingValues: Record<string, BlockValue>;
  requestLock: (key: string) => void;
  handleFieldUpdate: (
    blockId: string,
    newValue: BlockValue,
    shouldStream?: boolean,
  ) => void;
  handleFieldCommit: (id: string, value: BlockValue) => void;
  removeBlock: (id: string) => void;
  onOpenDrawer: (
    type: FieldType | 'layout' | 'saveLayout',
    id?: string,
  ) => void;
  contentBlockCount: number;
  handleDragEnd: () => void;
}) {
  const lockKey = `block:${block.id}`;
  const ownerSessionId = locks[lockKey];
  const isMyLock = !!ownerSessionId && ownerSessionId === mySessionId;
  const isLockedByOther = !!ownerSessionId && !isMyLock;
  const owner = useMemo(
    () => members.find((m) => m.sessionId === ownerSessionId),
    [members, ownerSessionId],
  );
  const isLastContentBlock = contentBlockCount === 1;

  const handleOpenDrawer = useCallback(
    (type: FieldType | 'layout' | 'saveLayout', id?: string) => {
      onOpenDrawer(type, id);
    },
    [onOpenDrawer],
  );

  const handleRemove = useCallback(() => {
    removeBlock(block.id);
  }, [removeBlock, block.id]);

  const handleUpdate = useCallback(
    (blockId: string, newValue: BlockValue, shouldStream?: boolean) => {
      handleFieldUpdate(blockId, newValue, shouldStream);
    },
    [handleFieldUpdate],
  );

  const handleCommit = useCallback(
    (id: string, value: BlockValue) => {
      handleFieldCommit(id, value);
    },
    [handleFieldCommit],
  );

  return (
    <div
      data-block-id={block.id}
      onPointerUp={handleDragEnd}
      onPointerCancel={handleDragEnd}
      className={`cursor-grab relative group/field ${isDraggingId ? 'touch-none' : 'touch-auto'} ${block.layout.span === 1 ? 'col-span-1' : 'col-span-2'} ${isDraggingId === block.id ? 'opacity-20 scale-95' : 'opacity-100'} ${!isDraggingId ? 'transition-all duration-300' : ''}`}
    >
      <div
        className={`relative w-full flex flex-row gap-2 items-center ${isDraggingId ? 'touch-none' : 'touch-auto'} ${
          block.layout.col === 1 ? 'justify-start' : 'justify-end'
        }`}
      >
        {isLockedByOther && owner && (
          <div className="w-6 h-6 rounded-full ring-2 ring-itta-point animate-pulse overflow-hidden shrink-0">
            {owner.profileImageId ? (
              <AssetImage
                assetId={owner.profileImageId}
                alt={`${owner.displayName} 편집 중`}
                width={24}
                height={24}
                className="w-full h-full rounded-full object-cover"
                title={owner.displayName}
              />
            ) : (
              <Image
                width={24}
                height={24}
                src={'/profile_base.png'}
                alt={`${owner.displayName} 편집 중`}
                className="w-full h-full rounded-full object-cover"
              />
            )}
          </div>
        )}
        <div className="flex items-center justify-center w-3.5 sm:w-4 h-full opacity-30 pointer-events-none">
          <GripVertical className="w-3.5 sm:w-4 h-3.5 sm:h-4 text-gray-500 dark:text-gray-200" />
        </div>
        <RecordFieldRenderer
          block={block}
          streamingValue={streamingValues[block.id]}
          requestLock={requestLock}
          onUpdate={handleUpdate}
          onCommit={handleCommit}
          onRemove={handleRemove}
          onOpenDrawer={handleOpenDrawer}
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
});

export default function PostEditor({
  mode,
  initialPost,
  draftId,
  groupId,
  postId,
  initialDate,
}: PostEditorProps) {
  const queryClient = useQueryClient();
  const [title, setTitle] = useState(initialPost?.title ?? '');
  const [blocks, setBlocks] = useState<RecordBlock[]>([]);

  const { socket, sessionId: mySessionId } = useSocketStore();
  const [locks, setLocks] = useState<Record<string, string>>({});

  // LOCK_DENIED 수신 시 열려있는 drawer가 해당 블록이면 강제 닫기
  // (usePostEditorBlocks보다 먼저 선언되므로 ref 패턴으로 최신 setActiveDrawer 참조)
  const onLockDeniedRef = useRef<((lockKey: string) => void) | undefined>(
    undefined,
  );
  const stableOnLockDenied = useCallback((lockKey: string) => {
    onLockDeniedRef.current?.(lockKey);
  }, []);

  const { requestLock, releaseLock, acquireExclusiveLock } = useLockManager(
    draftId,
    stableOnLockDenied,
  );
  const { uploadMultipleMedia } = useMediaUpload();
  const { data: group } = useQuery({
    ...groupDetailOptions(groupId!),
    enabled: !!groupId,
  });

  const [isSaving, setIsSaving] = useState(false);
  const {
    streamingValues,
    emitStream,
    applyPatch,
    versionRef,
    isPublishing,
    setIsPublishing,
    markNavigatingToRecord,
    resetNavigatingToRecord,
  } = useRecordCollaboration(
    draftId,
    setBlocks,
    setTitle,
    initialPost?.version, // 초기 버전 주입
  );
  const { execute } = useCreateRecord(groupId, postId, {
    onError: () => {
      setIsPublishing(false);
      setIsSaving(false);
      resetNavigatingToRecord();
    },
  });

  // 네비게이션이 실패하거나 느린 경우 로딩 화면이 무한히 뜨는 것을 방지하는 안전망
  useEffect(() => {
    if (!isPublishing) return;
    const timer = setTimeout(() => setIsPublishing(false), 10_000);
    return () => clearTimeout(timer);
  }, [isPublishing, setIsPublishing]);

  // 개인 기록 저장 응답이 너무 오래 걸릴 경우 로딩 화면 해제 및 알림
  useEffect(() => {
    if (!isSaving) return;
    const timer = setTimeout(() => {
      setIsSaving(false);
      toast.error('네트워크 지연 또는 기록 저장에 실패했습니다. 다시 시도해 주세요.');
    }, 10_000);
    return () => clearTimeout(timer);
  }, [isSaving]);

  const {
    activeDrawer,
    setActiveDrawer,
    fileInputRef,
    updateFieldValue,
    handleDone,
    addOrShowBlock,
    removeBlock,
    //handleApplyTemplate,
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

  // LOCK_DENIED 수신 시 해당 블록의 drawer가 열려있으면 강제 닫기
  // (렌더마다 최신 activeDrawer/setActiveDrawer를 ref에 반영)
  onLockDeniedRef.current = (lockKey: string) => {
    if (activeDrawer?.id && `block:${activeDrawer.id}` === lockKey) {
      setActiveDrawer(null);
    }
  };

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

  const { gridRef, isDraggingId, handleGridDragOver, handleDragEnd } =
    useRecordEditorDnD(blocks, setBlocks, canBeHalfWidth, applyPatch, draftId);

  // 페이지 초기화/복구 및 위치 데이터 받기
  const resolvedInitialPost = initialPost
    ? { title: initialPost?.title, blocks: initialPost?.blocks }
    : undefined;

  // 에디터 초기화
  usePostEditorInitializer({
    initialPost: resolvedInitialPost,
    initialDate,
    onInitialized: ({ title, blocks }) => {
      setTitle(title);
      setBlocks(blocks);
    },
  });

  // draftId가 있지만 initialPost가 없는 경우 처리
  // (발행 직후 또는 잘못된 draft ID)
  const draftTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    // initialPost가 로드되면 타이머 클리어
    if (initialPost && draftTimeoutRef.current) {
      clearTimeout(draftTimeoutRef.current);
      draftTimeoutRef.current = null;
      return;
    }

    // draftId가 있지만 initialPost가 없으면 타이머 시작
    // isPublishing 중에는 발행 직후 재렌더링으로 initialPost가 undefined가 되는 정상 상황이므로 무시
    if (draftId && !initialPost && groupId && !isPublishing) {
      draftTimeoutRef.current = setTimeout(() => {
        toast.error('기록을 찾을 수 없습니다.');
        window.location.href = `/group/${groupId}`;
      }, 3000);
    }

    return () => {
      if (draftTimeoutRef.current) {
        clearTimeout(draftTimeoutRef.current);
        draftTimeoutRef.current = null;
      }
    };
  }, [draftId, initialPost, groupId, isPublishing]);

  const { members } = useDraftPresence(
    draftId,
    groupId,
    isPublishing,
    initialPost?.version ?? 0,
  );

  // 서버의 LOCK_CHANGED 브로드캐스트 수신
  useEffect(() => {
    if (!socket) return;

    const handleLockChanged = ({
      lockKey,
      ownerSessionId,
    }: LockResponsePayload) => {
      setLocks((prev) => {
        const newLocks = { ...prev };
        if (ownerSessionId) {
          newLocks[lockKey] = ownerSessionId;
        } else {
          delete newLocks[lockKey];
        }
        return newLocks;
      });
    };

    // 드래프트 입장 시 서버가 보내는 현재 락 상태를 즉시 반영.
    // 이를 하지 않으면 B가 입장할 때 A가 이미 잡고 있는 락을 알 수 없어
    // LOCK_CHANGED가 오기 전까지 "다른 유저 편집 중" 표시가 안 됨.
    // 주의: socket.off(event) (콜백 없음)는 ALL 핸들러를 제거하므로
    // useDraftPresence가 등록한 PRESENCE_SNAPSHOT 핸들러까지 삭제되는 버그를 방지하기 위해
    // 반드시 콜백 참조를 저장하고 socket.off(event, handler)로 제거해야 함.
    const handlePresenceSnapshot = ({
      locks: snapshotLocks,
    }: {
      locks?: Record<string, string>;
    }) => {
      if (snapshotLocks && Object.keys(snapshotLocks).length > 0) {
        setLocks(snapshotLocks);
      }
    };

    // 소켓 재연결 시 새 sessionId가 부여되면 locks에 남아있는 이전 sessionId를 갱신.
    // 갱신하지 않으면 자신의 락이 isLockedByOther=true로 보여 "다른 사용자 편집 중" 오표시됨.
    const handlePresenceReplaced = ({
      previousSessionId,
      sessionId,
    }: {
      previousSessionId: string;
      sessionId: string;
    }) => {
      setLocks((prev) => {
        const hasStale = Object.values(prev).some(
          (v) => v === previousSessionId,
        );
        if (!hasStale) return prev;
        const updated: Record<string, string> = {};
        Object.entries(prev).forEach(([key, val]) => {
          updated[key] = val === previousSessionId ? sessionId : val;
        });
        return updated;
      });
    };

    socket.on('LOCK_CHANGED', handleLockChanged);
    socket.on('PRESENCE_SNAPSHOT', handlePresenceSnapshot);
    socket.on('PRESENCE_REPLACED', handlePresenceReplaced);

    return () => {
      socket.off('LOCK_CHANGED', handleLockChanged);
      socket.off('PRESENCE_SNAPSHOT', handlePresenceSnapshot);
      socket.off('PRESENCE_REPLACED', handlePresenceReplaced);
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

    // 이 effect run에서 요청한 락을 클로저에 캡처 (ref를 cleanup에서 읽으면 재실행 시 덮어쓴 값을 참조하는 버그)
    const locksAcquiredThisRun = [...metadataLocksRef.current];

    // cleanup: drawer가 닫힐 때 또는 컴포넌트가 unmount될 때 락 해제
    return () => {
      locksAcquiredThisRun.forEach((lockKey) => {
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

    // draft 모드에서 다른 사용자가 편집 중인 블록은 아직 커밋되지 않은 streaming 값을 사용
    const blocksToValidate = (
      draftId
        ? blocks.map((b) => {
            const ownerSessionId = locks[`block:${b.id}`];
            const isLockedByOther =
              !!ownerSessionId && ownerSessionId !== mySessionId;
            if (isLockedByOther && streamingValues[b.id]) {
              return { ...b, value: streamingValues[b.id] };
            }
            return b;
          })
        : blocks
    ) as RecordBlock[];

    const { isValid, message, filteredBlocks } = validateAndCleanRecord(
      title,
      blocksToValidate,
    );

    if (!isValid) {
      toast.error(message);
      return;
    }
    const scope = (groupId ? 'GROUP' : 'PERSONAL') as RecordScope;
    const isDraft = !!draftId;

    if (groupId && draftId) {
      // DRAFT_PUBLISHED 소켓이 HTTP 응답보다 먼저 도착할 수 있으므로
      // 발행 시작 시점에 즉시 플래그를 세워 소켓 중복 네비게이션 방지
      markNavigatingToRecord();
      setIsPublishing(true); // 동기적으로 설정해 타임아웃 useEffect 오작동 방지
      execute({
        draftId,
        draftVersion: versionRef.current,
        titleOverride: title,
        // 소켓 BLOCK_SET_VALUE/BLOCK_INSERT와 HTTP publish 간 race condition 방지:
        // 현재 프론트 블록 상태 전체를 전송해 서버 스냅샷을 완전 교체
        blocksOverride: filteredBlocks.map((b) => ({
          id: b.id,
          type: RecordFieldtypeMap[b.type] as string,
          // tempUrls는 로컬 미리보기 전용 — 서버 전송 불필요 (photos 블록에만 존재)
          value: (b.type === 'photos'
            ? { ...b.value, tempUrls: [] }
            : b.value) as Record<string, unknown>,
          layout: b.layout as unknown as Record<string, unknown>,
        })),
      });
      // revalidation은 useCreateRecord의 handleSuccess에서 처리
      return;
    }

    setIsSaving(true);

    try {
      if (groupId) {
        await refreshGroupData(groupId);
        queryClient.invalidateQueries({ queryKey: ['group', groupId] });
      }

      // 개인용 게시글 이미지 -> id 변환 로직
      const finalizedBlocks = await Promise.all(
        filteredBlocks.map(async (block) => {
          if (block.type === 'photos') {
            // draft 모드: tempUrls는 이미 업로드된 미리보기용 data URL — 재업로드 없이 제거
            if (isDraft) {
              return { ...block, value: { ...block.value, tempUrls: [] } };
            }

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
    } catch (e) {
      console.log(e);
      toast.error('사진 업로드에 실패했습니다. 다시 시도해 주세요.');
      setIsSaving(false);
    }
  };

  const { throttled: throttledEmitStream, flush: flushEmitStream } =
    useThrottle(
      useCallback(
        (blockId: string, newValue: BlockValue) => {
          if (draftId) {
            emitStream(blockId, newValue);
          }
        },
        [draftId, emitStream],
      ),
      3000,
    );

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
      // 값이 비어있어도 락은 반드시 해제
      releaseLock(`block:${id}`);
      return;
    }
    const lockKey = `block:${id}`;

    // focus 시 이미 requestLock을 호출했으므로 여기서 재요청하지 않음.
    // !isMine일 때 requestLock + 즉시 releaseLock을 하면 재포커스 후 새로 획득한 락이 해제되는 버그 발생.

    // 락을 해제하기 전에 대기 중인 쓰로틀링 업데이트를 모두 실행
    flushEmitStream();

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
      // 블록이 없어도(다른 유저가 삭제한 경우 등) 락은 반드시 해제
      if (draftId) releaseLock(`block:${id}`);
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
              const mediaIds = photoValue.mediaIds || [];
              const tempUrls = photoValue.tempUrls || [];

              let nextValue;
              if (mediaIds.length > 0) {
                // draft 모드: mediaIds와 tempUrls가 인덱스 대응 — 같이 제거
                nextValue = {
                  ...photoValue,
                  mediaIds: mediaIds.filter((_, i) => i !== idx),
                  tempUrls: tempUrls.filter((_, i) => i !== idx),
                };
              } else {
                // 일반 모드: tempUrls만
                nextValue = {
                  ...photoValue,
                  tempUrls: tempUrls.filter((_, i) => i !== idx),
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

  // BlockItem용 drawer 핸들러
  const handleOpenDrawerWrapper = useCallback(
    (type: FieldType | 'layout' | 'saveLayout', id?: string) => {
      setActiveDrawer({ type, id });
    },
    [setActiveDrawer],
  );

  return (
    <div className="w-full flex flex-col h-full bg-white dark:bg-[#121212]">
      {(isPublishing || isSaving) && <AuthLoadingScreen type="publish" />}
      <RecordEditorHeader mode={mode} onSave={handleSave} members={members} />
      <div className="mx-3 sm:mx-6 mt-2 sm:mt-3 flex flex-row gap-1.5 sm:gap-2">
        {group?.group.name ? (
          <div className="px-2 sm:px-3 w-fit items-center rounded-full py-0.5 sm:py-1 text-[11px] sm:text-[13px] font-bold bg-emerald-50 text-emerald-600 border border-emerald-100 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20">
            <span className="truncate inline-block align-bottom">
              {group?.group.name}
            </span>
          </div>
        ) : (
          <div className="flex items-center gap-0.5 sm:gap-1 px-2 sm:px-3 py-0.5 sm:py-1 rounded-full text-[11px] sm:text-[13px] font-bold bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400">
            <User className="w-3 sm:w-3.5 h-3 sm:h-3.5" />
            <span>개인</span>
          </div>
        )}
        {draftId && (
          <div className="px-2 sm:px-3 w-fit items-center rounded-full py-0.5 sm:py-1 text-[11px] sm:text-[13px] font-bold bg-blue-50 text-blue-600 border border-blue-100 dark:bg-blue-500/10 dark:text-blue-400 dark:border-blue-500/20">
            <span className="flex items-center gap-1 sm:gap-1.5 align-bottom">
              공동 기록 중...
            </span>
          </div>
        )}
      </div>

      <main
        className={cn(
          'flex-1 min-h-0 px-4 sm:px-6 space-y-4 sm:space-y-5 overflow-y-auto py-2 sm:py-3',
        )}
        style={{ paddingBottom: 'calc(7rem + env(safe-area-inset-bottom))' }}
      >
        <RecordTitleInput
          title={title}
          setTitle={setTitle}
          draftId={draftId}
          mySessionId={mySessionId}
          members={members}
          applyPatch={applyPatch}
          lockManager={{
            locks,
            requestLock: acquireExclusiveLock,
            releaseLock,
          }}
        />
        <div
          ref={gridRef}
          onDragOver={handleGridDragOver}
          className={`grid grid-cols-2 gap-x-2 sm:gap-x-3 gap-y-4 sm:gap-y-5 items-center pr-2 sm:pr-3 ${
            isDraggingId ? '' : 'transition-all duration-300'
          }`}
        >
          {blocks.map((block) => (
            <BlockItem
              key={block.id}
              block={block}
              isDraggingId={isDraggingId}
              locks={locks}
              mySessionId={mySessionId}
              members={members}
              streamingValues={streamingValues}
              requestLock={acquireExclusiveLock}
              handleFieldUpdate={handleFieldUpdate}
              handleFieldCommit={handleFieldCommit}
              removeBlock={removeBlock}
              onOpenDrawer={handleOpenDrawerWrapper}
              contentBlockCount={
                blocks.filter((b) => b.type === 'content').length
              }
              handleDragEnd={handleDragEnd}
            />
          ))}
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
        accept="image/jpeg, image/jpg, image/png, image/webp, image/heic, image/heif"
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
