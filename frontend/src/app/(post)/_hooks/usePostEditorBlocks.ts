import { useState, useRef, useCallback } from 'react';
import { v4 as uuidv4 } from 'uuid';

import { FieldType, LocationValue } from '@/lib/types/record';
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
import {
  extractMultipleExifMetadata,
  extractExifFromDataUrl,
  ExifMetadata,
} from '@/lib/utils/exifExtractor';

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

  // EXIF 메타데이터 상태
  const [pendingMetadata, setPendingMetadata] = useState<{
    images: ImageWithMetadata[];
    newImageUrls: string[];
    selectedMetadata?: SelectedMetadata;
    appliedImageUrls?: string[]; // 메타데이터가 적용된 모든 이미지 URL들
  } | null>(null);

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

    if (available <= 0) {
      toast.error('최대 개수를 초과했습니다.');
      return;
    }

    const filesToRead = Array.from(files).slice(0, available);

    try {
      // 이미지를 Base64로 변환
      const imagePromises = filesToRead.map(
        (file) =>
          new Promise<string>((res) => {
            const reader = new FileReader();
            reader.onload = (ev) => res(ev.target?.result as string);
            reader.readAsDataURL(file);
          }),
      );
      const newImages = await Promise.all(imagePromises);

      // 기존 이미지들에서 메타데이터 추출 (이미 추가된 사진들)
      const existingImagePromises =
        currentPhotoValue.tempUrls?.map(async (url) => ({
          imageUrl: url,
          metadata: await extractExifFromDataUrl(url),
        })) || [];

      const existingImagesWithMetadata = (
        await Promise.all(existingImagePromises)
      ).filter((img) => img.metadata.hasMetadata);

      // 새 이미지들에서 EXIF 메타데이터 추출
      const metadataResults = await extractMultipleExifMetadata(filesToRead);

      // 새 이미지들 중 메타데이터가 있는 것 필터링
      const newImagesWithMetadata = metadataResults
        .map((result, idx) => ({
          imageUrl: newImages[idx],
          metadata: result.metadata,
        }))
        .filter((img) => img.metadata.hasMetadata);

      // 기존 이미지와 새 이미지의 메타데이터 합치기
      const allImagesWithMetadata = [
        ...existingImagesWithMetadata,
        ...newImagesWithMetadata,
      ];

      // 메타데이터가 있는 이미지가 있으면 선택 드로어 표시
      if (allImagesWithMetadata.length > 0) {
        setPendingMetadata((prev) => ({
          images: allImagesWithMetadata,
          newImageUrls: newImages,
          appliedImageUrls: prev?.appliedImageUrls || [], // 기존 적용된 이미지 URL 유지
        }));
      } else {
        // 메타데이터가 없으면 바로 사진만 추가
        const updatedPhotoValue: PhotoValue = {
          ...currentPhotoValue,
          tempUrls: [...(currentPhotoValue.tempUrls || []), ...newImages],
        };
        handleDone(updatedPhotoValue, false);
      }
    } catch (error) {
      console.error('이미지 업로드 중 오류:', error);
      toast.error('이미지 업로드에 실패했습니다.');
    } finally {
      e.target.value = '';
    }
  };

  // 메타데이터 선택 및 즉시 적용
  const handleApplyMetadata = useCallback(
    (
      metadata: ExifMetadata,
      imageUrl: string,
      fields: {
        applyDate: boolean;
        applyTime: boolean;
        applyLocation: boolean;
      },
    ) => {
      if (!pendingMetadata) return;

      // photos 블록 ID 결정
      let photosBlockId = activeDrawer?.id;
      if (!photosBlockId) {
        photosBlockId = uuidv4();
        if (activeDrawer) {
          setActiveDrawer({ ...activeDrawer, id: photosBlockId });
        }
      }

      // 모든 블록 업데이트를 하나의 setBlocks 호출로 처리
      setBlocks((currentBlocks) => {
        let updatedBlocks = [...currentBlocks];

        // 사진 블록 추가/업데이트 (새 이미지가 있을 때만)
        if (pendingMetadata.newImageUrls.length > 0) {
          const existingPhotosIndex = updatedBlocks.findIndex(
            (b) => b.id === photosBlockId && b.type === 'photos',
          );

          const currentPhotoValue: PhotoValue =
            existingPhotosIndex >= 0
              ? (updatedBlocks[existingPhotosIndex].value as PhotoValue)
              : { mediaIds: [], tempUrls: [] };

          const updatedPhotoValue: PhotoValue = {
            ...currentPhotoValue,
            tempUrls: [
              ...(currentPhotoValue.tempUrls || []),
              ...pendingMetadata.newImageUrls,
            ],
          };

          if (existingPhotosIndex >= 0) {
            updatedBlocks[existingPhotosIndex] = {
              ...updatedBlocks[existingPhotosIndex],
              value: updatedPhotoValue,
            } as RecordBlock;
          } else {
            // 새 photos 블록 생성
            const newPhotoBlock = {
              id: photosBlockId!,
              type: 'photos' as const,
              value: updatedPhotoValue,
              layout: { row: 0, col: 0, span: 2 },
            } as RecordBlock;
            updatedBlocks = normalizeLayout([...updatedBlocks, newPhotoBlock]);
          }
        }

        // 날짜 블록 추가/업데이트
        if (fields.applyDate && metadata.date) {
          const dateBlockIndex = updatedBlocks.findIndex(
            (b) => b.type === 'date',
          );
          if (dateBlockIndex >= 0) {
            updatedBlocks[dateBlockIndex] = {
              ...updatedBlocks[dateBlockIndex],
              value: { date: metadata.date },
            } as RecordBlock;
          } else {
            const newDateBlock = {
              id: uuidv4(),
              type: 'date' as const,
              value: { date: metadata.date },
              layout: { row: 0, col: 0, span: 2 },
            } as RecordBlock;
            updatedBlocks = normalizeLayout([...updatedBlocks, newDateBlock]);
          }
        }

        // 시간 블록 추가/업데이트
        if (fields.applyTime && metadata.time) {
          const timeBlockIndex = updatedBlocks.findIndex(
            (b) => b.type === 'time',
          );
          if (timeBlockIndex >= 0) {
            updatedBlocks[timeBlockIndex] = {
              ...updatedBlocks[timeBlockIndex],
              value: { time: metadata.time },
            } as RecordBlock;
          } else {
            const newTimeBlock = {
              id: uuidv4(),
              type: 'time' as const,
              value: { time: metadata.time },
              layout: { row: 0, col: 0, span: 2 },
            } as RecordBlock;
            updatedBlocks = normalizeLayout([...updatedBlocks, newTimeBlock]);
          }
        }

        // 위치 블록 추가/업데이트
        if (fields.applyLocation && metadata.location) {
          const locationBlockIndex = updatedBlocks.findIndex(
            (b) => b.type === 'location',
          );
          const locationValue: LocationValue = {
            lat: metadata.location.latitude,
            lng: metadata.location.longitude,
            address: metadata.location.address,
            placeName: '',
          };
          if (locationBlockIndex >= 0) {
            updatedBlocks[locationBlockIndex] = {
              ...updatedBlocks[locationBlockIndex],
              value: locationValue,
            } as RecordBlock;
          } else {
            const newLocationBlock = {
              id: uuidv4(),
              type: 'location' as const,
              value: locationValue,
              layout: { row: 0, col: 0, span: 2 },
            } as RecordBlock;
            updatedBlocks = normalizeLayout([
              ...updatedBlocks,
              newLocationBlock,
            ]);
          }
        }

        return updatedBlocks;
      });

      // 메타데이터 선택 드로어를 닫음
      // 적용된 이미지 URL을 추가 (중복 제거)
      const currentAppliedUrls = pendingMetadata.appliedImageUrls || [];
      const newAppliedUrls = currentAppliedUrls.includes(imageUrl)
        ? currentAppliedUrls
        : [...currentAppliedUrls, imageUrl];

      setPendingMetadata({
        images: [],
        newImageUrls: [],
        selectedMetadata: { metadata, imageUrl, fields },
        appliedImageUrls: newAppliedUrls,
      });
    },
    [
      pendingMetadata,
      activeDrawer,
      setPendingMetadata,
      setBlocks,
      setActiveDrawer,
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

      // 메타데이터 적용 완료
      setPendingMetadata(null);
    },
    [blocks, updateFieldValue],
  );

  // 메타데이터 적용 건너뛰기
  const handleSkipMetadata = () => {
    if (!pendingMetadata) return;

    const existingPhotos = blocks.find(
      (b) => b.id === activeDrawer?.id && b.type === 'photos',
    ) as Extract<RecordBlock, { type: 'photos' }> | undefined;
    const currentPhotoValue: PhotoValue = existingPhotos?.value || {
      mediaIds: [],
      tempUrls: [],
    };

    // 사진만 추가
    const updatedPhotoValue: PhotoValue = {
      ...currentPhotoValue,
      tempUrls: [
        ...(currentPhotoValue.tempUrls || []),
        ...pendingMetadata.newImageUrls,
      ],
    };
    applyPendingMetadata(pendingMetadata);

    requestAnimationFrame(() => {
      handleDone(updatedPhotoValue, false);
      setPendingMetadata(null);
    });
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
          appliedImageUrls: prev?.appliedImageUrls || [], // 기존 적용된 이미지 URL 유지
        }));
      } else {
        toast.error('메타데이터가 있는 이미지가 없습니다.');
      }
    } catch (error) {
      console.error('메타데이터 추출 중 오류:', error);
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
    handleApplyTemplate,
    handlePhotoUpload,
    pendingMetadata,
    handleApplyMetadata,
    handleSkipMetadata,
    applyPendingMetadata,
    handleEditMetadata,
  };
}
