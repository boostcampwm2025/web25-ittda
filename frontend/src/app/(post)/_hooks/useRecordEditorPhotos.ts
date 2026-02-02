import { useState, useCallback, useRef } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { toast } from 'sonner';

import { BlockValue, FieldType, LocationValue } from '@/lib/types/record';
import { RecordBlock, PhotoValue } from '@/lib/types/recordField';

import {
  extractMultipleExifMetadata,
  extractExifFromDataUrl,
  ExifMetadata,
} from '@/lib/utils/exifExtractor';

import { normalizeLayout } from '../_utils/recordLayoutHelper';
import * as Sentry from '@sentry/nextjs';

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
}
export function useRecordEditorPhotos({
  blocks,
  setBlocks,
  activeDrawer,
  setActiveDrawer,
  handleDone,
  draftId,
  uploadMultipleMedia,
}: RecordEditorPhotos) {
  // EXIF 메타데이터 상태
  const pendingFilesRef = useRef<Map<string, File>>(new Map());
  const [pendingMetadata, setPendingMetadata] = useState<{
    images: ImageWithMetadata[];
    newImageUrls: string[];
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
    const filesToRead = Array.from(files);
    const isDraft = !!draftId;
    let uploadedIds: string[] = [];
    try {
      if (isDraft && uploadMultipleMedia) {
        uploadedIds = await uploadMultipleMedia(filesToRead);
      }
      // 이미지를 Base64로 변환
      const newImages = await Promise.all(
        filesToRead.map(
          (file) =>
            new Promise<string>((res) => {
              const reader = new FileReader();
              reader.onload = (ev) => {
                const url = ev.target?.result as string;
                pendingFilesRef.current.set(url, file);
                res(url);
              };
              reader.readAsDataURL(file);
            }),
        ),
      );

      // 기존 이미지 메타데이터
      const existingImagesWithMetadata = await Promise.all(
        (currentPhotoValue.tempUrls || []).map(async (url) => ({
          imageUrl: url,
          metadata: await extractExifFromDataUrl(url),
        })),
      );

      // 새 이미지 메타데이터
      const metadataResults = await extractMultipleExifMetadata(filesToRead);

      const newImagesWithMetadata = metadataResults
        .map((result, idx) => ({
          imageUrl: newImages[idx],
          metadata: result.metadata,
        }))
        .filter((img) => img.metadata.hasMetadata);

      const allImagesWithMetadata = [
        ...existingImagesWithMetadata.filter((img) => img.metadata.hasMetadata),
        ...newImagesWithMetadata,
      ];

      if (allImagesWithMetadata.length > 0) {
        setPendingMetadata((prev) => ({
          images: allImagesWithMetadata,
          newImageUrls: newImages,
          appliedMetadata: prev?.appliedMetadata || {},
        }));
      } else {
        // 메타데이터 없으면 바로 추가
        let updatedPhotoValue: PhotoValue = {};
        if (draftId) {
          updatedPhotoValue = {
            mediaIds: [
              ...(existingPhotos?.value.mediaIds || []),
              ...uploadedIds,
            ],
            tempUrls: [],
          };
        } else {
          updatedPhotoValue = {
            ...currentPhotoValue,
            tempUrls: [...(currentPhotoValue.tempUrls || []), ...newImages],
          };
        }

        handleDone(updatedPhotoValue, false);
      }
    } catch (err) {
      Sentry.captureException(err, {
        level: 'error',
        tags: {
          context: 'post-editor',
          operation: 'image-upload',
        },
        extra: {
          isDraft: isDraft,
        },
      });
      console.error(err);
      toast.error('이미지 업로드에 실패했습니다.');
    } finally {
      e.target.value = '';
    }
  };

  /**
   * 메타데이터 적용
   */
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
        setActiveDrawer({
          type: 'photos',
          id: photosBlockId,
        });
      }
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

        const nextValue: PhotoValue = {
          ...currentPhotoValue,
          tempUrls: [
            ...(currentPhotoValue.tempUrls || []),
            ...pendingMetadata.newImageUrls,
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

        // date / time / location 블록 처리
        const applySingleField = (
          type: 'date' | 'time' | 'location',
          value: BlockValue,
        ) => {
          const i = updated.findIndex((b) => b.type === type);
          if (i >= 0) {
            updated[i] = { ...updated[i], value } as RecordBlock;
          } else {
            updated = normalizeLayout([
              ...updated,
              {
                id: uuidv4(),
                type,
                value,
                layout: { row: 0, col: 0, span: 2 },
              } as RecordBlock,
            ]);
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

      setPendingMetadata({
        images: [],
        newImageUrls: [],
        selectedMetadata: { metadata, imageUrl, fields },
        appliedMetadata: pendingMetadata.appliedMetadata || {},
      });
    },
    [pendingMetadata, activeDrawer?.id, setBlocks, setActiveDrawer],
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
                  value: {
                    ...b.value,
                    tempUrls: [
                      ...(b.value.tempUrls || []),
                      ...pendingMetadata.newImageUrls,
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
            value: {
              mediaIds: [],
              tempUrls: pendingMetadata.newImageUrls,
            },
            layout: { row: 0, col: 0, span: 2 },
          } as RecordBlock,
        ]);
      }
    });

    setPendingMetadata({
      images: [],
      newImageUrls: [],
      appliedMetadata: pendingMetadata.appliedMetadata || {},
    });
  };

  /**
   * 기존 사진 메타데이터 편집
   */
  const handleEditMetadata = async () => {
    const photoBlock = blocks.find(
      (b) => b.id === activeDrawer?.id && b.type === 'photos',
    ) as Extract<RecordBlock, { type: 'photos' }> | undefined;

    if (!photoBlock) return;

    const urls = [
      ...(photoBlock.value.mediaIds || []),
      ...(photoBlock.value.tempUrls || []),
    ];

    const images = (
      await Promise.all(
        urls.map(async (url) => ({
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
