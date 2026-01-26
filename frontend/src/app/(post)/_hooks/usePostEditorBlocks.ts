import { useState, useRef, useCallback } from 'react';
import { v4 as uuidv4 } from 'uuid';

import { FieldType } from '@/lib/types/record';
import { RecordBlock, BlockValue, PhotoValue } from '@/lib/types/recordField';
import { TemplateRecord } from '@/lib/types/template';

import { FIELD_META } from '@/lib/constants/record';
import {
  getDefaultValue,
  isRecordBlockEmpty,
  normalizeLayout,
} from '../_utils/recordLayoutHelper';
import { toast } from 'sonner';
import { PatchApplyPayload } from '@/lib/types/recordCollaboration';
import { RecordFieldtypeMap } from '@/lib/utils/mapBlocksToPayload';

// 개수 제한
const MULTI_INSTANCE_LIMITS: Partial<Record<FieldType, number>> = {
  emotion: 4,
  table: 4,
  content: 4,
  photos: 10,
};

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

        setBlocks(
          (prev) =>
            prev.map((b) =>
              b.id === id ? { ...b, value } : b,
            ) as RecordBlock[],
        );
        return id;
      }
    },
    [blocks, draftId, mySessionId, locks, applyPatch, requestLock, setBlocks],
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
    (type: FieldType) => {
      const meta = FIELD_META[type];
      const existing = blocks.find((b) => b.type === type);

      // 한 블록만 추가할 수 있는 애는
      // 기존 블록이 있다면 열 때 바로 락 요청
      if (meta.isSingle && existing) {
        if (draftId) requestLock(`block:${existing.id}`);
        setActiveDrawer({ type, id: existing.id });
        return;
      }

      if (meta.requiresDrawer) {
        setActiveDrawer({ type, id: undefined });
      } else {
        //TEXT,TABLE 바로 생성
        updateFieldValue(getDefaultValue(type), undefined, type);
      }
    },
    [blocks, draftId, requestLock, updateFieldValue],
  );
  //사진 업로드
  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || activeDrawer?.type !== 'photos') return;

    const existingPhotos = blocks.find(
      (b) => b.id === activeDrawer.id && b.type === 'photos',
    ) as Extract<RecordBlock, { type: 'photos' }> | undefined;
    const currentPhotoValue: PhotoValue = existingPhotos?.value || {
      mediaIds: [],
      tempUrls: [],
    };

    const currentCount =
      (currentPhotoValue.mediaIds?.length || 0) +
      (currentPhotoValue.tempUrls?.length || 0);
    const limit = MULTI_INSTANCE_LIMITS['photos'] || 10;
    const available = limit - currentCount;

    //TODO: 추후 toast 도입
    if (available <= 0) return alert('최대 개수를 초과했습니다.');

    const filesToRead = Array.from(files).slice(0, available);
    const promises = filesToRead.map(
      (file) =>
        new Promise<string>((res) => {
          const reader = new FileReader();
          reader.onload = (ev) => res(ev.target?.result as string);
          reader.readAsDataURL(file);
        }),
    );

    try {
      const newImages = await Promise.all(promises);
      const updatedPhotoValue: PhotoValue = {
        ...currentPhotoValue,
        tempUrls: [...(currentPhotoValue.tempUrls || []), ...newImages],
      };

      handleDone(updatedPhotoValue, false);
    } finally {
      e.target.value = '';
    }
  };

  //지금해야할거
  // 여기서 타입이 필드면 락 걸고 삭제하고 락 풀고
  // 여기서 타입이 드로어라면, 바로 삭제만하고(삭제전에 락 검증해야할까?)
  const removeBlock = (id: string, type?: string) => {
    if (draftId) {
      const lockKey = `block:${id}`;
      requestLock(lockKey);
      // 서버 사양에 맞춘 BLOCK_DELETE 명령 전송
      applyPatch({
        type: 'BLOCK_DELETE',
        blockId: id,
      });
      releaseLock(lockKey);
    }

    // 로컬 상태 반영 및 레이아웃 정규화
    setBlocks((prev) => normalizeLayout(prev.filter((b) => b.id !== id)));
  };

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
    handleApplyTemplate,
    handlePhotoUpload,
  };
}
