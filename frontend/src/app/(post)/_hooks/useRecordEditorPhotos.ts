import { useState, useCallback, useRef, useEffect } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { toast } from 'sonner';

import { BlockValue, FieldType, LocationValue } from '@/lib/types/record';
import { RecordBlock, PhotoValue } from '@/lib/types/recordField';

import {
  extractExifFromDataUrl,
  extractExifMetadata,
  ExifMetadata,
} from '@/lib/utils/exifExtractor';

import {
  isRecordBlockEmpty,
  normalizeLayout,
} from '../_utils/recordLayoutHelper';
import { MULTI_INSTANCE_LIMITS } from '@/lib/constants/record';
import * as Sentry from '@sentry/nextjs';
import { logger } from '@/lib/utils/logger';
import { PatchApplyPayload } from '@/lib/types/recordCollaboration';
import { UploadMultipleResult } from '@/hooks/useMediaUpload';

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
  uploadMultipleMedia?: (files: File[]) => Promise<UploadMultipleResult>;
  applyPatch?: (patch: PatchApplyPayload | PatchApplyPayload[]) => void;
  releaseLock?: (lockKey: string) => void;
  removeBlock?: (id: string) => void;
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
  removeBlock,
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

  // 사진 업로드 ~ EXIF 추출 ~ 블록/메타데이터 반영까지 전체 처리 중 여부.
  // 이 동안 PhotoDrawer를 닫지 못하게 막아야 activeDrawer가 바뀌어
  // 업로드 결과가 다른 블록에 잘못 반영되거나 유실되는 문제를 방지할 수 있다.
  const [isProcessingPhotos, setIsProcessingPhotos] = useState(false);

  // 서버 업로드가 끝나기 전, 본인 화면에 먼저 보여줄 미리보기 URL (blob/data URL).
  // 블록에 반영(3단계) 또는 처리 종료 시 비워진다.
  const [pendingPreviewUrls, setPendingPreviewUrls] = useState<string[]>([]);

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
    // draft 모드: mediaIds와 tempUrls는 같은 이미지를 가리키는 1:1 병렬 배열이므로
    // 하나만 기준으로 센다. mediaIds가 있으면 그 길이, 없으면 tempUrls 길이.
    const mediaIdsCount = currentPhotoValue.mediaIds?.length || 0;
    const tempUrlsCount = currentPhotoValue.tempUrls?.length || 0;
    const currentCount = mediaIdsCount > 0 ? mediaIdsCount : tempUrlsCount;

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

    setIsProcessingPhotos(true);
    try {
      // 1단계: 이미지 업로드 + 미리보기 URL 생성 (핵심 단계 — 실패 시 toast)
      // draft 모드: blob URL 사용 (HEIC 등 WebView에서 data URL 렌더링 불가 문제 방지)
      // 일반 모드: data URL 사용 (저장 시 pendingFilesRef로 File 매칭 필요)
      let dataUrls: string[] = []; // EXIF 추출용 data URL (draft 포함)
      try {
        if (isDraft) {
          // Android content:// URI 소진 문제 방지:
          // getImageDimensions·XHR·exifr 등 여러 작업이 동일 File을 읽으면
          // 이후 <img>가 blob URL에서 읽으려 할 때 content URI가 이미 닫혀 이미지가 깨짐.
          // arrayBuffer()로 한 번에 메모리로 읽어 in-memory 복사본을 만든 뒤
          // 모든 후속 작업(표시·업로드·EXIF)에 복사본을 사용.
          const buffers = await Promise.all(
            filesToRead.map((f) => f.arrayBuffer()),
          );
          filesToRead = filesToRead.map(
            (file, i) =>
              new File([buffers[i]], file.name, {
                type: file.type || 'image/jpeg',
              }),
          );
          newImages = buffers.map((buffer, i) => {
            const blob = new Blob([buffer], {
              type: filesToRead[i].type || 'image/jpeg',
            });
            const url = URL.createObjectURL(blob);
            blobUrlsRef.current.push(url);
            return url;
          });
          dataUrls = newImages;
          // 업로드 완료 전 자기 자신에게 먼저 미리보기 표시
          setPendingPreviewUrls(newImages);
        }

        if (isDraft && uploadMultipleMedia) {
          const uploadResult = await uploadMultipleMedia(filesToRead);
          uploadedIds = uploadResult.successIds;

          if (uploadResult.failedIndices.length > 0) {
            const failedSet = new Set(uploadResult.failedIndices);

            // 업로드 실패한 이미지는 blob URL을 해제하고
            // 결과/미리보기/EXIF 추출 대상에서 제외한다.
            newImages.forEach((url, i) => {
              if (failedSet.has(i)) {
                URL.revokeObjectURL(url);
                blobUrlsRef.current = blobUrlsRef.current.filter(
                  (u) => u !== url,
                );
              }
            });
            filesToRead = filesToRead.filter((_, i) => !failedSet.has(i));
            newImages = newImages.filter((_, i) => !failedSet.has(i));
            dataUrls = dataUrls.filter((_, i) => !failedSet.has(i));
            setPendingPreviewUrls(newImages);

            toast.warning(
              `${uploadResult.failedIndices.length}장의 이미지 업로드에 실패해 제외되었습니다.`,
            );
          }
        }

        if (!isDraft) {
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
          setPendingPreviewUrls(newImages);
        }
      } catch (err) {
        // 업로드 실패로 사용되지 않게 된 blob URL 정리 (draft 모드)
        newImages.forEach((url) => {
          if (url.startsWith('blob:')) URL.revokeObjectURL(url);
        });
        blobUrlsRef.current = blobUrlsRef.current.filter(
          (u) => !newImages.includes(u),
        );

        Sentry.captureException(err, {
          level: 'error',
          tags: { context: 'post-editor', operation: 'image-upload' },
          extra: { isDraft },
        });
        logger.error('이미지 업로드에 실패', err);
        toast.error('이미지 업로드에 실패했습니다.');

        // 새로 생성된 빈 사진 블록이라면(기존 이미지 없음) 블록 자체를 제거
        const photosBlockId = activeDrawer?.id;
        if (
          photosBlockId &&
          removeBlock &&
          isRecordBlockEmpty(currentPhotoValue)
        ) {
          removeBlock(photosBlockId);
          setActiveDrawer(null);
        }

        e.target.value = '';
        return;
      }

      // 2단계: EXIF 메타데이터 추출 (실패해도 이미지 추가는 계속 진행)
      let allImagesWithMetadata: {
        imageUrl: string;
        metadata: ExifMetadata;
      }[] = [];
      try {
        const existingImagesWithMetadata = await Promise.all(
          (currentPhotoValue.tempUrls || []).map(async (url) => ({
            imageUrl: url,
            metadata: await extractExifFromDataUrl(url),
          })),
        );

        const newImagesWithMetadata = (
          await Promise.all(
            isDraft
              ? // draft 모드: File 객체로 직접 EXIF 추출 (blob URL은 exifr 파싱 불가)
                filesToRead.map(async (file, i) => ({
                  imageUrl: newImages[i],
                  metadata: await extractExifMetadata(file),
                }))
              : // 일반 모드: data URL로 EXIF 추출
                dataUrls.map(async (url, i) => ({
                  imageUrl: newImages[i],
                  metadata: await extractExifFromDataUrl(url),
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
        if (draftId) {
          // draft 모드: handleApplyMetadata와 동일하게 setBlocks + applyPatch + 드로어 직접 닫기
          // handleDone → handleCloseDrawer 경로는 다른 collaborator의 patch와 버전 충돌 가능성 있음
          const photosBlockId = activeDrawer?.id;
          const nextValue: PhotoValue = {
            mediaIds: [...(existingPhotos?.value.mediaIds || []), ...uploadedIds],
            // tempUrls: 로컬 미리보기용 fallback — WebSocket 전송 시에는 제거됨 (useRecordCollaboration.applyPatch)
            tempUrls: [...(existingPhotos?.value.tempUrls || []), ...newImages],
          };

          setBlocks((prev) =>
            prev.map((b) =>
              b.id === photosBlockId && b.type === 'photos'
                ? ({ ...b, value: nextValue } as RecordBlock)
                : b,
            ),
          );

          if (photosBlockId && applyPatch) {
            applyPatch({
              type: 'BLOCK_SET_VALUE',
              blockId: photosBlockId,
              value: nextValue,
            });
          }

          if (photosBlockId && releaseLock) {
            releaseLock(`block:${photosBlockId}`);
          }

          // handleApplyMetadata와 동일하게 드로어를 직접 닫아 handleCloseDrawer 경유를 막음
          // handleCloseDrawer가 닫힐 때 PATCH_APPLY를 재전송하면 버전 충돌로 PATCH_REJECTED_STALE 발생
          setActiveDrawer(null);
        } else {
          const updatedPhotoValue: PhotoValue = {
            ...currentPhotoValue,
            tempUrls: [...(currentPhotoValue.tempUrls || []), ...newImages],
          };
          handleDone(updatedPhotoValue, false);
        }
      }

      e.target.value = '';
    } finally {
      setIsProcessingPhotos(false);
      setPendingPreviewUrls([]);
    }
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
    isProcessingPhotos,
    pendingPreviewUrls,
    handlePhotoUpload,
    handleApplyMetadata,
    handleSkipMetadata,
    handleEditMetadata,
    removePendingFile,
  };
}
