import { useState, useCallback, useRef, useEffect } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { toast } from 'sonner';

import { BlockValue, FieldType, LocationValue } from '@/lib/types/record';
import { RecordBlock, PhotoValue } from '@/lib/types/recordField';

import {
  extractExifFromDataUrl,
  ExifMetadata,
} from '@/lib/utils/exifExtractor';

import { normalizeLayout } from '../_utils/recordLayoutHelper';
import { MULTI_INSTANCE_LIMITS } from '@/lib/constants/record';
import * as Sentry from '@sentry/nextjs';
import { logger } from '@/lib/utils/logger';
import { PatchApplyPayload } from '@/lib/types/recordCollaboration';

interface ImageWithMetadata {
  imageUrl: string;
  metadata: ExifMetadata;
}

interface SelectedMetadata {
  metadata: ExifMetadata;
  imageUrl: string;
  fields: {
    applyDate: boolean;
    applyTime: boolean;
    applyLocation: boolean;
  };
}
interface RecordEditorPhotos {
  blocks: RecordBlock[];
  setBlocks: React.Dispatch<React.SetStateAction<RecordBlock[]>>;
  activeDrawer: {
    type: FieldType | 'layout' | 'saveLayout';
    id?: string;
  } | null;
  setActiveDrawer: React.Dispatch<
    React.SetStateAction<{
      type: FieldType | 'layout' | 'saveLayout';
      id?: string;
    } | null>
  >;
  handleDone: (val: BlockValue, shouldClose?: boolean) => void;
  draftId?: string;
  uploadMultipleMedia?: (files: File[]) => Promise<string[]>;
  applyPatch?: (patch: PatchApplyPayload | PatchApplyPayload[]) => void;
  releaseLock?: (lockKey: string) => void;
}
const PHOTO_LIMIT = MULTI_INSTANCE_LIMITS['photos'] || 5;
export function useRecordEditorPhotos({
  blocks,
  setBlocks,
  activeDrawer,
  setActiveDrawer,
  handleDone,
  draftId,
  uploadMultipleMedia,
  applyPatch,
  releaseLock,
}: RecordEditorPhotos) {
  // draft 모드에서 생성한 blob URL 목록 — 언마운트 시 revoke
  const blobUrlsRef = useRef<string[]>([]);
  useEffect(() => {
    return () => {
      blobUrlsRef.current.forEach((url) => URL.revokeObjectURL(url));
    };
  }, []);

  // EXIF 메타데이터 상태
  const pendingFilesRef = useRef<Map<string, File>>(new Map());
  const [pendingMetadata, setPendingMetadata] = useState<{
    images: ImageWithMetadata[];
    newImageUrls: string[];
    uploadedIds?: string[]; // draft 모드에서 이미 업로드된 mediaIds
    selectedMetadata?: SelectedMetadata;
    appliedMetadata?: {
      [imageUrl: string]: {
        date: boolean;
        time: boolean;
        location: boolean;
      };
    };
  } | null>(null);

  /**
   * 사진 업로드
   */
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
    // 10개인 상태에서 추가할 때
    const currentCount =
      (currentPhotoValue.mediaIds?.length || 0) +
      (currentPhotoValue.tempUrls?.length || 0);

    const availableSlot = PHOTO_LIMIT - currentCount;

    if (availableSlot <= 0) {
      toast.warning(`사진은 최대 ${PHOTO_LIMIT}장까지만 추가할 수 있습니다.`);
      e.target.value = ''; // 선택 초기화
      return;
    }

    let filesToRead = Array.from(files);

    // 10개 초과 시 남은 것만 채우기
    if (filesToRead.length > availableSlot) {
      toast.warning(
        `최대 개수를 초과하여 앞의 ${availableSlot}장의 사진만 추가됩니다.`,
      );
      filesToRead = filesToRead.slice(0, availableSlot);
    }
    const isDraft = !!draftId;
    let uploadedIds: string[] = [];
    let newImages: string[] = [];

    // 1단계: 이미지 업로드 + 미리보기 URL 생성 (핵심 단계 — 실패 시 toast)
    // draft 모드: blob URL 사용 (HEIC 등 WebView에서 data URL 렌더링 불가 문제 방지)
    // 일반 모드: data URL 사용 (저장 시 pendingFilesRef로 File 매칭 필요)
    let dataUrls: string[] = []; // EXIF 추출용 data URL (draft 포함)
    try {
      if (isDraft && uploadMultipleMedia) {
        uploadedIds = await uploadMultipleMedia(filesToRead);
      }

      if (isDraft) {
        // draft 모드: tempUrls = blob URL (미리보기) — HEIC 포함 모든 포맷 렌더링 가능
        newImages = filesToRead.map((file) => {
          const url = URL.createObjectURL(file);
          blobUrlsRef.current.push(url);
          return url;
        });
        // EXIF용 data URL은 별도 비필수 단계에서 추출 (실패해도 업로드에 영향 없음)
        dataUrls = newImages; // 일단 blob URL로 채워둠 (아래 EXIF 단계에서 교체 시도)
      } else {
        newImages = await Promise.all(
          filesToRead.map(
            (file) =>
              new Promise<string>((res, rej) => {
                const reader = new FileReader();
                reader.onload = (ev) => {
                  const url = ev.target?.result as string;
                  pendingFilesRef.current.set(url, file);
                  res(url);
                };
                reader.onerror = rej;
                reader.readAsDataURL(file);
              }),
          ),
        );
        dataUrls = newImages;
      }
    } catch (err) {
      Sentry.captureException(err, {
        level: 'error',
        tags: { context: 'post-editor', operation: 'image-upload' },
        extra: { isDraft },
      });
      logger.error('이미지 업로드에 실패', err);
      toast.error('이미지 업로드에 실패했습니다.');
      e.target.value = '';
      return;
    }

    // 2단계: EXIF 메타데이터 추출 (실패해도 이미지 추가는 계속 진행)
    let allImagesWithMetadata: {
      imageUrl: string;
      metadata: import('@/lib/utils/exifExtractor').ExifMetadata;
    }[] = [];
    try {
      // draft 모드: blob URL로는 EXIF 추출 불가 → data URL로 변환 시도 (실패해도 계속 진행)
      if (isDraft) {
        const resolved = await Promise.allSettled(
          filesToRead.map(
            (file) =>
              new Promise<string>((res, rej) => {
                const reader = new FileReader();
                reader.onload = (ev) => res(ev.target?.result as string);
                reader.onerror = rej;
                reader.readAsDataURL(file);
              }),
          ),
        );
        dataUrls = resolved.map((r, i) =>
          r.status === 'fulfilled' ? r.value : newImages[i],
        );
      }

      const existingImagesWithMetadata = await Promise.all(
        (currentPhotoValue.tempUrls || []).map(async (url) => ({
          imageUrl: url,
          metadata: await extractExifFromDataUrl(url),
        })),
      );

      const newImagesWithMetadata = (
        await Promise.all(
          dataUrls.map(async (url, i) => ({
            imageUrl: newImages[i], // 미리보기용 URL (blob or data)
            metadata: await extractExifFromDataUrl(url), // EXIF는 data URL 필요
          })),
        )
      ).filter((img) => img.metadata.hasMetadata);

      allImagesWithMetadata = [
        ...existingImagesWithMetadata.filter((img) => img.metadata.hasMetadata),
        ...newImagesWithMetadata,
      ];
    } catch {
      // EXIF 추출 실패는 무시 — 이미지 추가는 정상 진행
    }

    // 3단계: 메타데이터 있으면 drawer, 없으면 바로 추가
    if (allImagesWithMetadata.length > 0) {
      setPendingMetadata((prev) => ({
        images: allImagesWithMetadata,
        newImageUrls: newImages,
        uploadedIds: uploadedIds.length > 0 ? uploadedIds : undefined,
        appliedMetadata: prev?.appliedMetadata || {},
      }));
    } else {
      let updatedPhotoValue: PhotoValue = {};
      if (draftId) {
        // tempUrls는 로컬 미리보기용 fallback — WebSocket 전송 시에는 제거됨 (useRecordCollaboration.applyPatch)
        updatedPhotoValue = {
          mediaIds: [...(existingPhotos?.value.mediaIds || []), ...uploadedIds],
          tempUrls: [...(existingPhotos?.value.tempUrls || []), ...newImages],
        };
      } else {
        updatedPhotoValue = {
          ...currentPhotoValue,
          tempUrls: [...(currentPhotoValue.tempUrls || []), ...newImages],
        };
      }
      handleDone(updatedPhotoValue, false);
    }

    e.target.value = '';
  };

  /**
   * 메타데이터 적용
   */
  const handleApplyMetadata = useCallback(
    (
      metadata: ExifMetadata,
      _imageUrl: string,
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
        setActiveDrawer({
          type: 'photos',
          id: photosBlockId,
        });
      }

      // 업데이트된 블록들의 ID, 값, 최종 블록 정보 추적
      const updatedBlocks: {
        id: string;
        value: BlockValue;
        type?: 'date' | 'time' | 'location';
        isNew?: boolean;
        finalBlock?: RecordBlock;
      }[] = [];

      // 모든 블록 업데이트를 하나의 setBlocks 호출로 처리
      setBlocks((prev) => {
        let updated = [...prev];

        // 사진 블록 추가/업데이트 (새 이미지가 있을 때만)
        const idx = updated.findIndex(
          (b) => b.id === photosBlockId && b.type === 'photos',
        );

        const currentPhotoValue: PhotoValue =
          idx >= 0
            ? (updated[idx].value as PhotoValue)
            : { mediaIds: [], tempUrls: [] };

        // draft 모드: uploadedIds가 있으면 추가
        // 일반 모드: newImageUrls가 있으면 추가
        const nextValue: PhotoValue = draftId
          ? {
              mediaIds: [
                ...(currentPhotoValue.mediaIds || []),
                ...(pendingMetadata.uploadedIds || []),
              ],
              // tempUrls: 로컬 미리보기용 fallback (WebSocket 전송 시 제거됨)
              tempUrls: [
                ...(currentPhotoValue.tempUrls || []),
                ...(pendingMetadata.newImageUrls || []),
              ],
            }
          : {
              mediaIds: currentPhotoValue.mediaIds || [],
              tempUrls: [
                ...(currentPhotoValue.tempUrls || []),
                ...(pendingMetadata.newImageUrls || []),
              ],
            };

        if (idx >= 0) {
          updated[idx] = { ...updated[idx], value: nextValue } as RecordBlock;
        } else {
          // 새 photos 블록 생성
          updated = normalizeLayout([
            ...updated,
            {
              id: photosBlockId!,
              type: 'photos',
              value: nextValue,
              layout: { row: 0, col: 0, span: 2 },
            },
          ]);
        }

        // 사진 블록 추적
        updatedBlocks.push({ id: photosBlockId!, value: nextValue });

        // date / time / location 블록 처리
        const applySingleField = (
          type: 'date' | 'time' | 'location',
          value: BlockValue,
        ) => {
          const i = updated.findIndex((b) => b.type === type);
          if (i >= 0) {
            // 기존 블록 업데이트
            updated[i] = { ...updated[i], value } as RecordBlock;
            updatedBlocks.push({
              id: updated[i].id,
              value,
              type,
              isNew: false,
            });
          } else {
            // 새 블록 생성
            const newBlockId = uuidv4();
            const newBlock = {
              id: newBlockId,
              type,
              value,
              layout: { row: 0, col: 0, span: 2 },
            } as RecordBlock;
            updated = normalizeLayout([...updated, newBlock]);

            // normalizeLayout 적용된 최종 블록 찾기
            const finalBlock = updated.find((b) => b.id === newBlockId);
            updatedBlocks.push({
              id: newBlockId,
              value,
              type,
              isNew: true,
              finalBlock,
            });
          }
        };

        if (fields.applyDate && metadata.date) {
          applySingleField('date', { date: metadata.date });
        }

        if (fields.applyTime && metadata.time) {
          applySingleField('time', { time: metadata.time });
        }

        if (fields.applyLocation && metadata.location) {
          const loc: LocationValue = {
            lat: metadata.location.latitude,
            lng: metadata.location.longitude,
            address: metadata.location.address,
            placeName: '',
          };
          applySingleField('location', loc);
        }

        return updated;
      });

      // draft 모드에서 서버에 동기화 (패치 큐 사용)
      if (draftId && applyPatch) {
        const patchBlock: PatchApplyPayload[] = [];
        // 1. photos 블록 업데이트

        if (photosBlockId) {
          const photosUpdate = updatedBlocks.find(
            (b) => b.id === photosBlockId,
          );
          if (photosUpdate) {
            patchBlock.push({
              type: 'BLOCK_SET_VALUE',
              blockId: photosUpdate.id,
              value: photosUpdate.value,
            });
          }
        }

        // 2. 새로 생성된 date/time/location 블록들
        updatedBlocks
          .filter((b) => b.isNew && b.finalBlock)
          .forEach((b) => {
            if (b.finalBlock) {
              patchBlock.push({
                type: 'BLOCK_INSERT',
                block: b.finalBlock,
              });
            }
          });

        // 3. 기존 date/time/location 블록 업데이트
        updatedBlocks
          .filter((b) => !b.isNew && b.type)
          .forEach((b) => {
            patchBlock.push({
              type: 'BLOCK_SET_VALUE',
              blockId: b.id,
              value: b.value,
            });
          });

        // 큐 처리 시작
        applyPatch(patchBlock);
      }

      // 메타데이터 필드 락 해제
      if (draftId && releaseLock) {
        // photos 블록 락 해제
        if (photosBlockId) {
          releaseLock(`block:${photosBlockId}`);
        }

        const dateBlock = blocks.find((b) => b.type === 'date');
        const timeBlock = blocks.find((b) => b.type === 'time');
        const locationBlock = blocks.find((b) => b.type === 'location');

        if (dateBlock && fields.applyDate) {
          releaseLock(`block:${dateBlock.id}`);
        }
        if (timeBlock && fields.applyTime) {
          releaseLock(`block:${timeBlock.id}`);
        }
        if (locationBlock && fields.applyLocation) {
          releaseLock(`block:${locationBlock.id}`);
        }
      }

      // photos 드로어를 직접 닫아 handleCloseDrawer 경유를 막음.
      // handleApplyMetadata가 이미 photos BLOCK_SET_VALUE를 커밋했으므로
      // handleCloseDrawer가 닫힐 때 동일한 baseVersion으로 PATCH_APPLY를 재전송하면
      // PATCH_COMMITTED 도착 전에 두 번째 패치가 나가 PATCH_REJECTED_STALE이 발생함.
      setActiveDrawer(null);
      setPendingMetadata(null); // drawer 닫기
    },
    [
      pendingMetadata,
      activeDrawer?.id,
      setBlocks,
      setActiveDrawer,
      draftId,
      applyPatch,
      releaseLock,
      blocks,
    ],
  );

  /**
   * 메타데이터 스킵
   */
  const handleSkipMetadata = () => {
    if (!pendingMetadata) return;

    // photos 블록 ID 결정
    let photosBlockId = activeDrawer?.id;
    if (!photosBlockId) {
      photosBlockId = uuidv4();
      setActiveDrawer({
        type: 'photos',
        id: photosBlockId,
      });
    }

    setBlocks((prev) => {
      const idx = prev.findIndex(
        (b) => b.id === photosBlockId && b.type === 'photos',
      );

      if (idx >= 0) {
        // 기존 블록 업데이트
        return normalizeLayout(
          prev.map((b) =>
            b.id === photosBlockId && b.type === 'photos'
              ? {
                  ...b,
                  value: draftId
                    ? {
                        mediaIds: [
                          ...(b.value.mediaIds || []),
                          ...(pendingMetadata.uploadedIds || []),
                        ],
                        // tempUrls: 로컬 미리보기용 fallback (WebSocket 전송 시 제거됨)
                        tempUrls: [
                          ...(b.value.tempUrls || []),
                          ...(pendingMetadata.newImageUrls || []),
                        ],
                      }
                    : {
                        mediaIds: b.value.mediaIds || [],
                        tempUrls: [
                          ...(b.value.tempUrls || []),
                          ...(pendingMetadata.newImageUrls || []),
                        ],
                      },
                }
              : b,
          ),
        );
      } else {
        // 새 블록 생성
        return normalizeLayout([
          ...prev,
          {
            id: photosBlockId!,
            type: 'photos',
            value: draftId
              ? {
                  mediaIds: pendingMetadata.uploadedIds || [],
                  // tempUrls: 로컬 미리보기용 fallback (WebSocket 전송 시 제거됨)
                  tempUrls: pendingMetadata.newImageUrls || [],
                }
              : {
                  mediaIds: [],
                  tempUrls: pendingMetadata.newImageUrls || [],
                },
            layout: { row: 0, col: 0, span: 2 },
          } as RecordBlock,
        ]);
      }
    });

    setPendingMetadata(null); // drawer 닫기
  };

  /**
   * 기존 사진 메타데이터 편집 (개인 글에서만 작동)
   */
  const handleEditMetadata = async () => {
    const photoBlock = blocks.find(
      (b) => b.id === activeDrawer?.id && b.type === 'photos',
    ) as Extract<RecordBlock, { type: 'photos' }> | undefined;

    if (!photoBlock) return;

    // tempUrls만 메타데이터 추출 가능 (data URL 형식)
    const tempUrls = photoBlock.value.tempUrls || [];

    if (tempUrls.length === 0) {
      toast.error('메타데이터를 추출할 수 있는 이미지가 없습니다.');
      return;
    }

    const images = (
      await Promise.all(
        tempUrls.map(async (url) => ({
          imageUrl: url,
          metadata: await extractExifFromDataUrl(url),
        })),
      )
    ).filter((img) => img.metadata.hasMetadata);

    if (images.length === 0) {
      toast.error('메타데이터가 있는 이미지가 없습니다.');
      return;
    }

    setPendingMetadata({
      images,
      newImageUrls: [],
      appliedMetadata: pendingMetadata?.appliedMetadata || {},
    });
  };
  const removePendingFile = (url: string) => {
    pendingFilesRef.current.delete(url);
  };

  return {
    pendingMetadata,
    pendingFilesRef,
    handlePhotoUpload,
    handleApplyMetadata,
    handleSkipMetadata,
    handleEditMetadata,
    removePendingFile,
  };
}
