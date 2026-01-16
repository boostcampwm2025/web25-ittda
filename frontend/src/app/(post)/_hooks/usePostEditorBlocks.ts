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

// 개수 제한
const MULTI_INSTANCE_LIMITS: Partial<Record<FieldType, number>> = {
  emotion: 4,
  table: 4,
  content: 4,
  photos: 10,
};

export function usePostEditorBlocks() {
  // 전체 블록 상태
  const [blocks, setBlocks] = useState<RecordBlock[]>([]);

  const [activeDrawer, setActiveDrawer] = useState<{
    type: FieldType | 'layout' | 'saveLayout';
    id?: string;
  } | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  //필드 값 업데이트 및 삭제
  const updateFieldValue = useCallback(
    (value: BlockValue, id?: string, type?: FieldType) => {
      // 기존 블록인데 값이 비었으면 삭제
      if (id && isRecordBlockEmpty(value)) {
        setBlocks((prev) => normalizeLayout(prev.filter((b) => b.id !== id)));
        setActiveDrawer(null);
        return undefined;
      }

      const targetId = id || uuidv4();
      setBlocks((prev) => {
        const exists = prev.some((b) => b.id === id);
        if (exists) {
          return prev.map((b) =>
            b.id === id ? { ...b, value } : b,
          ) as RecordBlock[];
        } else if (type && !isRecordBlockEmpty(value)) {
          return normalizeLayout([
            ...prev,
            {
              id: targetId,
              type,
              value,
              layout: { row: 0, col: 0, span: 2 },
            } as RecordBlock,
          ]);
        }
        return prev;
      });
      return targetId;
    },
    [],
  );

  const handleDone = (val: BlockValue, shouldClose = true) => {
    if (!activeDrawer) return;

    const updatedId = updateFieldValue(
      val,
      activeDrawer.id,
      activeDrawer.type as FieldType,
    );

    if (shouldClose) {
      // 저장 후 드로어 닫기
      setActiveDrawer(null);
    } else if (!activeDrawer.id && updatedId) {
      // 닫지 않고, 신규 생성된 ID를 드로어 상태에 동기화
      setActiveDrawer({ ...activeDrawer, id: updatedId });
    }
  };

  //블록 추가/열기 로직
  const addOrShowBlock = (type: FieldType) => {
    const meta = FIELD_META[type];
    const existing = blocks.find((b) => b.type === type);

    if (meta.isSingle && existing) {
      setActiveDrawer({ type, id: existing.id });
      return;
    }

    const limit = MULTI_INSTANCE_LIMITS[type];
    if (limit && blocks.filter((b) => b.type === type).length >= limit) {
      //TODO: 추후 toast 도입 시 변경
      alert(`${type} 필드는 최대 ${limit}개까지만 가능합니다.`);
      return;
    }

    if (meta.requiresDrawer) {
      setActiveDrawer({ type }); // ID 없이 열기
    } else {
      updateFieldValue(getDefaultValue(type), undefined, type);
    }
  };

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

  const removeBlock = (id: string) => {
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
