import { useState } from 'react';
import * as Sentry from '@sentry/nextjs';
import { logger } from '@/lib/utils/logger';
import { toast } from 'sonner';
import type { ApiError } from '@/lib/utils/errorHandler';
import {
  postMediaPresign,
  uploadFileToStorage,
  postMediaComplete,
} from '@/lib/api/presignMedia';
import { getImageDimensions } from '@/lib/utils/image';

const EXT_TO_MIME: Record<string, string> = {
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  png: 'image/png',
  webp: 'image/webp',
  heic: 'image/heic',
  heif: 'image/heif',
};

function resolveContentType(file: File): string {
  if (file.type) return file.type;
  const ext = file.name.split('.').pop()?.toLowerCase() ?? '';
  return EXT_TO_MIME[ext] ?? 'image/jpeg';
}

export interface UploadedMedia {
  mediaId: string;
  uploadUrl: string; // presigned PUT URL (업로드 직후 임시 표시용)
}

export const useMediaUpload = () => {
  const [isUploading, setIsUploading] = useState(false);

  /**
   * 여러 파일 업로드 후 mediaId 배열 반환
   * draft 모드에서는 uploadUrl도 함께 반환하여 PATCH_COMMITTED 전 임시 미리보기에 활용
   */
  const uploadMultipleMedia = async (files: File[]): Promise<string[]> => {
    if (files.length === 0) return [];
    setIsUploading(true);

    try {
      const fileInfos = await Promise.all(
        files.map(async (f) => ({
          file: f,
          dimensions: await getImageDimensions(f).catch(() => ({
            width: 0,
            height: 0,
          })),
        })),
      );

      const presignItems = await postMediaPresign(
        fileInfos.map(({ file, dimensions }) => ({
          contentType: resolveContentType(file),
          size: file.size,
          width: dimensions.width,
        })),
      );

      await Promise.all(
        presignItems.map((item, index) =>
          uploadFileToStorage(
            item.uploadUrl,
            files[index],
            resolveContentType(files[index]),
          ),
        ),
      );

      const mediaIds = presignItems.map((item) => item.mediaId);
      const successIds = await postMediaComplete(mediaIds);

      return successIds;
    } catch (error) {
      if ((error as ApiError)?.code === 'TIMEOUT') {
        toast.error('이미지 업로드 시간이 초과되었습니다.', {
          description: '네트워크 연결을 확인하고 다시 시도해 주세요.',
        });
      }

      Sentry.captureException(error, {
        tags: { context: 'media', operation: 'upload-multiple' },
        extra: {
          filesCount: files.length,
          fileTypes: files.map((f) => f.type),
          totalSize: files.reduce((sum, f) => sum + f.size, 0),
        },
      });
      logger.error('이미지 업로드 실패', error);

      throw error;
    } finally {
      setIsUploading(false);
    }
  };

  return { uploadMultipleMedia, isUploading };
};
