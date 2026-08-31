import { useState, useRef, useCallback, useEffect } from 'react';
import { v4 as uuidv4 } from 'uuid';

import { FieldType, LocationValue } from '@/lib/types/record';
import { RecordBlock, BlockValue, PhotoValue } from '@/lib/types/recordField';
import { TemplateRecord } from '@/lib/types/template';

import { FIELD_META, MULTI_INSTANCE_LIMITS } from '@/lib/constants/record';
import {
  getDefaultValue,
  isRecordBlockEmpty,
  normalizeLayout,
} from '../_utils/recordLayoutHelper';
import { PatchApplyPayload } from '@/lib/types/recordCollaboration';
import { RecordFieldtypeMap } from '@/lib/utils/mapBlocksToPayload';
import { toast } from 'sonner';
import {
  extractExifFromDataUrl,
  ExifMetadata,
} from '@/lib/utils/exifExtractor';
import * as Sentry from '@sentry/nextjs';
import { logger } from '@/lib/utils/logger';
import { useSocketStore } from '@/store/useSocketStore';

// 블록 삭제 응답을 기다리는 최대 시간. 이 시간 내에 PATCH_COMMITTED로
// 삭제가 확정되지 않으면(락 미보유로 백엔드가 거부한 경우 등) 원상복구한다.
const DELETE_CONFIRM_TIMEOUT_MS = 8_000;

interface UsePostEditorBlocksProps {
  blocks: RecordBlock[];
  setBlocks: React.Dispatch<React.SetStateAction<RecordBlock[]>>;
  draftId?: string;
  mySessionId?: string;
  locks?: Record<string, string>;
  requestLock: (lockKey: string) => void;
  releaseLock: (lockKey: string) => void;
  applyPatch: (patch: PatchApplyPayload) => void;
}

interface ImageWithMetadata {
  imageUrl: string;
  metadata: ExifMetadata;
}

interface SelectedMetadata {
  metadata: ExifMetadata;
  imageUrl: string; // 메타데이터가 추출된 이미지 URL
  fields: {
    applyDate: boolean;
    applyTime: boolean;
    applyLocation: boolean;
  };
}

export function usePostEditorBlocks({
  blocks,
  setBlocks,
  draftId,
  mySessionId,
  locks,
  requestLock,
  releaseLock,
  applyPatch,
}: UsePostEditorBlocksProps) {
  const [activeDrawer, setActiveDrawer] = useState<{
    type: FieldType | 'layout' | 'saveLayout';
    id?: string;
  } | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const { socket } = useSocketStore();

  // 삭제 요청을 보냈지만 백엔드 커밋 확인을 기다리는 중인 블록 id 집합.
  // (비관적 삭제: 커밋 확인 전까지 블록을 화면에 "삭제 중" 상태로 남겨둔다)
  const [deletingBlockIds, setDeletingBlockIds] = useState<Set<string>>(
    new Set(),
  );
  const deleteTimeoutsRef = useRef<Map<string, NodeJS.Timeout>>(new Map());

  const finalizeBlockDeletion = useCallback((id: string) => {
    const timeout = deleteTimeoutsRef.current.get(id);
    if (timeout) {
      clearTimeout(timeout);
      deleteTimeoutsRef.current.delete(id);
    }
    setDeletingBlockIds((prev) => {
      if (!prev.has(id)) return prev;
      const next = new Set(prev);
      next.delete(id);
      return next;
    });
  }, []);

  // 내가 보낸 BLOCK_DELETE가 실제로 커밋됐는지 PATCH_COMMITTED로 확인한다.
  // (락을 보유하지 않은 채 삭제를 시도하면 백엔드가 거부할 수 있는데,
  // 이 경우 PATCH_COMMITTED가 오지 않으므로 아래 타임아웃에서 원상복구된다)
  useEffect(() => {
    if (!socket || !draftId) return;

    const handlePatchCommitted = ({
      patch,
    }: {
      patch: PatchApplyPayload | PatchApplyPayload[];
    }) => {
      const commands = Array.isArray(patch) ? patch : [patch];
      commands.forEach((cmd) => {
        if (cmd.type !== 'BLOCK_DELETE') return;
        if (!deleteTimeoutsRef.current.has(cmd.blockId)) return;

        finalizeBlockDeletion(cmd.blockId);
        setBlocks((prev) =>
          normalizeLayout(prev.filter((b) => b.id !== cmd.blockId)),
        );
      });
    };

    socket.on('PATCH_COMMITTED', handlePatchCommitted);
    return () => {
      socket.off('PATCH_COMMITTED', handlePatchCommitted);
    };
  }, [socket, draftId, finalizeBlockDeletion, setBlocks]);

  // 언마운트 시 남아있는 삭제 대기 타임아웃 정리
  useEffect(() => {
    return () => {
      deleteTimeoutsRef.current.forEach((timeout) => clearTimeout(timeout));
      deleteTimeoutsRef.current.clear();
    };
  }, []);

  // EXIF 메타데이터 상태
  const [pendingMetadata, setPendingMetadata] = useState<{
    images: ImageWithMetadata[];
    newImageUrls: string[];
    selectedMetadata?: SelectedMetadata;
    appliedMetadata?: {
      // 이미지 URL별로 어떤 필드가 적용되었는지 추적
      [imageUrl: string]: {
        date: boolean;
        time: boolean;
        location: boolean;
      };
    };
  } | null>(null);

  const removeBlock = useCallback(
    (id: string) => {
      // 블록 타입 확인하여 메타데이터 적용 상태 업데이트

      const block = blocks.find((b) => b.id === id);

      if (!block) return;

      if (pendingMetadata?.appliedMetadata) {
        const fieldType = block.type;
        if (
          fieldType === 'date' ||
          fieldType === 'time' ||
          fieldType === 'location'
        ) {
          // 해당 필드가 삭제되면 모든 이미지의 해당 필드 적용 상태 제거
          setPendingMetadata((prev) => {
            if (!prev?.appliedMetadata) return prev;

            const updatedAppliedMetadata = { ...prev.appliedMetadata };
            Object.keys(updatedAppliedMetadata).forEach((imageUrl) => {
              updatedAppliedMetadata[imageUrl] = {
                ...updatedAppliedMetadata[imageUrl],
                [fieldType]: false,
              };
            });

            return {
              ...prev,
              appliedMetadata: updatedAppliedMetadata,
            };
          });
        }
      }

      // 공동작성 중이 아니면(draftId 없음) 락 개념이 없으므로 즉시 로컬 삭제
      if (!draftId) {
        setBlocks((prev) => normalizeLayout(prev.filter((b) => b.id !== id)));
        return;
      }

      if (deletingBlockIds.has(id)) return; // 이미 삭제 요청 중

      const lockKey = `block:${id}`;
      const ownerSessionId = locks?.[lockKey];
      const isLockedByOther =
        !!ownerSessionId && ownerSessionId !== mySessionId;

      // 다른 사용자가 편집 중인 블록은 삭제 차단
      if (isLockedByOther) {
        toast.error('다른 사용자가 편집 중인 필드는 삭제할 수 없습니다.', {
          id: `delete-locked-${lockKey}`,
        });
        return;
      }

      // 비관적 삭제: 락을 보유하지 않은 채로 곧바로 로컬에서 지워버리면,
      // 백엔드가 락 없음을 이유로 삭제를 거부했을 때 프론트와 백엔드의 블록 목록이
      // 어긋나 저장 시 같은 위치에 두 블록이 겹치는 문제가 있었음.
      // PATCH_COMMITTED로 삭제가 커밋된 걸 확인하기 전까지는 "삭제 중" 상태로만 표시한다.
      setDeletingBlockIds((prev) => {
        const next = new Set(prev);
        next.add(id);
        return next;
      });

      applyPatch({
        type: 'BLOCK_DELETE',
        blockId: id,
      });
      // 내가 락을 쥐고 있었다면 해제
      if (ownerSessionId === mySessionId) {
        releaseLock(lockKey);
      }

      // 타임아웃 내에 PATCH_COMMITTED가 오지 않으면(백엔드 거부, 응답 지연 등) 원상복구
      const timeout = setTimeout(() => {
        deleteTimeoutsRef.current.delete(id);
        setDeletingBlockIds((prev) => {
          if (!prev.has(id)) return prev;
          const next = new Set(prev);
          next.delete(id);
          return next;
        });
        toast.error('삭제에 실패했습니다. 다시 시도해 주세요.', {
          id: `delete-failed-${id}`,
        });
      }, DELETE_CONFIRM_TIMEOUT_MS);
      deleteTimeoutsRef.current.set(id, timeout);
    },
    [
      blocks,
      pendingMetadata,
      draftId,
      applyPatch,
      releaseLock,
      setBlocks,
      locks,
      mySessionId,
      deletingBlockIds,
    ],
  );

  //필드 값 업데이트 및 삭제
  const updateFieldValue = useCallback(
    (value: BlockValue, id?: string, type?: FieldType) => {
      // 삭제 로직
      if (id && isRecordBlockEmpty(value)) {
        removeBlock(id);
        setActiveDrawer(null);
        return undefined;
      }

      // 신규 생성 로직 (id가 없는 상태에서 첫 클릭)
      // 콘텐츠, 테이블 처음 들어왔을 때
      // 드로어에서 처음 클릭했을 때
      if (!id && type) {
        const newId = uuidv4();
        const newBlock = {
          id: newId,
          type,
          value,
          layout: { row: 0, col: 0, span: 2 },
        } as RecordBlock;

        const nextBlocks = normalizeLayout([...blocks, newBlock]);
        const normalized = nextBlocks.find((b) => b.id === newId)!;

        if (draftId) {
          applyPatch({
            type: 'BLOCK_INSERT',
            block: {
              ...normalized,
              type: RecordFieldtypeMap[normalized.type],
              // TODO: 서버와 필드 타입 맞춘 후 any 제거
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
            } as any,
          });
        }

        setBlocks(nextBlocks);
        return newId; // 생성된 ID 반환
      }

      // 기존 블록 업데이트
      if (id) {
        const lockKey = `block:${id}`;
        // 내가 락을 가지고 있지 않다면 요청
        if (
          draftId &&
          activeDrawer?.id === id &&
          locks?.[lockKey] !== mySessionId
        ) {
          requestLock(lockKey);
        }

        // 블록 타입 확인하여 메타데이터 적용 상태 업데이트
        const block = blocks.find((b) => b.id === id);
        if (block && pendingMetadata?.appliedMetadata) {
          const fieldType = block.type;
          if (
            fieldType === 'date' ||
            fieldType === 'time' ||
            fieldType === 'location'
          ) {
            // 해당 필드가 수동으로 수정되면 모든 이미지의 해당 필드 적용 상태 제거
            setPendingMetadata((prev) => {
              if (!prev?.appliedMetadata) return prev;

              const updatedAppliedMetadata = { ...prev.appliedMetadata };
              Object.keys(updatedAppliedMetadata).forEach((imageUrl) => {
                updatedAppliedMetadata[imageUrl] = {
                  ...updatedAppliedMetadata[imageUrl],
                  [fieldType]: false,
                };
              });

              return {
                ...prev,
                appliedMetadata: updatedAppliedMetadata,
              };
            });
          }
        }

        setBlocks(
          (prev) =>
            prev.map((b) =>
              b.id === id ? { ...b, value } : b,
            ) as RecordBlock[],
        );
        return id;
      }
    },
    [
      removeBlock,
      blocks,
      draftId,
      mySessionId,
      locks,
      applyPatch,
      requestLock,
      setBlocks,
      pendingMetadata,
      setPendingMetadata,
      activeDrawer?.id,
    ],
  );

  // 드로어 내에서 아이템 클릭 시 호출
  const handleDone = (val: BlockValue, shouldClose = false) => {
    if (!activeDrawer) return;
    const updatedId = updateFieldValue(
      val,
      activeDrawer.id,
      activeDrawer.type as FieldType,
    );

    // 새로 생성된 경우 드로어 상태에 ID 동기화
    if (!activeDrawer.id && updatedId) {
      setActiveDrawer({ ...activeDrawer, id: updatedId });
    }

    //바로 드로어 끄도록
    if (shouldClose && updatedId) {
      if (draftId) releaseLock(`block:${updatedId}`);
      setActiveDrawer(null);
    }
  };

  const addOrShowBlock = useCallback(
    (type: FieldType, initialValue?: BlockValue) => {
      //debugger;
      const meta = FIELD_META[type];
      const existingBlocks = blocks.filter((b) => b.type === type);
      const limit = MULTI_INSTANCE_LIMITS[type];

      if (meta.isSingle && existingBlocks.length > 0) {
        const existing = existingBlocks[0];
        const lockKey = `block:${existing.id}`;
        const ownerSessionId = locks?.[lockKey];
        const isLockedByOther =
          !!ownerSessionId && ownerSessionId !== mySessionId;

        // 타인이 락을 쥐고 있다면 동작 차단
        if (isLockedByOther) {
          toast.error('현재 다른 사용자가 편집 중입니다.', {
            id: `locked-${lockKey}`,
          });
          return;
        }
      }
      if (type === 'location') {
        let targetId: string | undefined = existingBlocks[0]?.id;

        if (!targetId) {
          targetId = updateFieldValue(
            getDefaultValue('location'),
            undefined,
            'location',
          );
        }

        if (targetId) {
          if (draftId) requestLock(`block:${targetId}`);
          setActiveDrawer({ type: 'location', id: targetId });
        }
        return;
      }

      // 단일 블록이고 이미 존재하는 경우
      if (meta.isSingle && existingBlocks.length > 0) {
        const existing = existingBlocks[0];
        if (initialValue) {
          updateFieldValue(initialValue, existing.id);
        } else {
          if (draftId) requestLock(`block:${existing.id}`);
          setActiveDrawer({ type, id: existing.id });
        }
        return;
      }

      // 개수 제한 (여러개 가능 + limit 존재 + 초과 했을 때)
      if (!meta.isSingle && limit && existingBlocks.length >= limit) {
        const fieldName = meta.label || type;
        toast.warning(
          `${fieldName} 필드는 최대 ${limit}개까지만 추가할 수 있습니다.`,
        );
        return;
      }

      // if (type === 'location') {
      //   let targetId: string | undefined = existingBlocks[0]?.id;

      //   if (!targetId) {
      //     targetId = updateFieldValue(
      //       getDefaultValue('location'),
      //       undefined,
      //       'location',
      //     );
      //   }

      //   return;
      // }

      // 받아온 데이터 있는데 블록 없는 경우
      if (initialValue) {
        const newId = updateFieldValue(initialValue, undefined, type);

        if (draftId && newId) {
          releaseLock(`block:${newId}`);
        }
        return;
      }
      const targetId = updateFieldValue(getDefaultValue(type), undefined, type);
      // 새 블록 생성 시 즉시 락 요청.
      // 서버는 BLOCK_INSERT 처리 후 자동으로 락을 획득하고 LOCK_GRANTED를 보내는데,
      // activeLockKeys에 해당 키가 없으면 handleLockGranted가 즉시 LOCK_RELEASE를 날려버림.
      // 미리 activeLockKeys에 등록해두면 LOCK_GRANTED 수신 시 하트비트가 정상 시작됨.
      if (draftId && targetId) requestLock(`block:${targetId}`);
      if (meta.requiresDrawer) {
        setActiveDrawer({ type, id: targetId });
      }
    },
    [
      blocks,
      draftId,
      releaseLock,
      requestLock,
      updateFieldValue,
      locks,
      mySessionId,
    ],
  );

  // 메타데이터 실제 적용
  const applyPendingMetadata = useCallback(
    (meta: typeof pendingMetadata) => {
      if (!meta?.selectedMetadata) return;

      const { metadata, fields } = meta.selectedMetadata;

      // 각 필드를 개별적으로 적용
      // 날짜 적용
      if (fields.applyDate && metadata.date) {
        const dateBlock = blocks.find((b) => b.type === 'date');
        if (dateBlock) {
          updateFieldValue({ date: metadata.date }, dateBlock.id);
        } else {
          updateFieldValue({ date: metadata.date }, undefined, 'date');
        }
      }

      // 시간 적용
      if (fields.applyTime && metadata.time) {
        const timeBlock = blocks.find((b) => b.type === 'time');
        if (timeBlock) {
          updateFieldValue({ time: metadata.time }, timeBlock.id);
        } else {
          updateFieldValue({ time: metadata.time }, undefined, 'time');
        }
      }

      // 위치 적용
      if (fields.applyLocation && metadata.location) {
        const locationBlock = blocks.find((b) => b.type === 'location');
        const locationValue: LocationValue = {
          lat: metadata.location.latitude,
          lng: metadata.location.longitude,
          address: metadata.location.address,
          placeName: '',
        };
        if (locationBlock) {
          updateFieldValue(locationValue, locationBlock.id);
        } else {
          updateFieldValue(locationValue, undefined, 'location');
        }
      }

      // 메타데이터 적용 완료 - setPendingMetadata는 호출하는 쪽에서 관리
    },
    [blocks, updateFieldValue],
  );

  const handleApplyTemplate = (template: TemplateRecord) => {
    const newBlocks = template.blocks.map((tBlock) => ({
      id: uuidv4(),
      type: tBlock.type as FieldType,
      value: getDefaultValue(tBlock.type as FieldType),
      layout: { ...tBlock.layout },
    })) as RecordBlock[];

    setBlocks(normalizeLayout(newBlocks));
    setActiveDrawer(null);
  };

  // 메타데이터 편집 (이미 업로드된 이미지들로부터 메타데이터 추출)
  const handleEditMetadata = async () => {
    const existingPhotos = blocks.find(
      (b) => b.id === activeDrawer?.id && b.type === 'photos',
    ) as Extract<RecordBlock, { type: 'photos' }> | undefined;

    if (!existingPhotos) return;

    const currentPhotoValue: PhotoValue = existingPhotos.value;
    const allUrls = [
      ...(currentPhotoValue.mediaIds || []),
      ...(currentPhotoValue.tempUrls || []),
    ];

    if (allUrls.length === 0) return;

    try {
      // 모든 이미지에서 메타데이터 추출
      const imagePromises = allUrls.map(async (url) => ({
        imageUrl: url,
        metadata: await extractExifFromDataUrl(url),
      }));

      const imagesWithMetadata = (await Promise.all(imagePromises)).filter(
        (img) => img.metadata.hasMetadata,
      );

      if (imagesWithMetadata.length > 0) {
        setPendingMetadata((prev) => ({
          images: imagesWithMetadata,
          newImageUrls: [], // 새 이미지 없음
          appliedMetadata: prev?.appliedMetadata || {}, // 기존 적용된 메타데이터 유지
        }));
      } else {
        toast.error('메타데이터가 있는 이미지가 없습니다.');
      }
    } catch (error) {
      Sentry.captureException(error, {
        level: 'warning',
        tags: {
          context: 'image-metadata',
          operation: 'extract-image-metadata',
        },
        extra: {
          imageUrls: allUrls,
        },
      });
      logger.error('메타데이터 추출 중 오류', error);

      toast.error('메타데이터 추출에 실패했습니다.');
    }
  };

  return {
    blocks,
    setBlocks, // 초기화 useEffect에서 사용
    activeDrawer,
    setActiveDrawer,
    fileInputRef,
    updateFieldValue,
    handleDone,
    addOrShowBlock,
    removeBlock,
    deletingBlockIds,
    handleApplyTemplate,
    applyPendingMetadata,
    handleEditMetadata,
  };
}
