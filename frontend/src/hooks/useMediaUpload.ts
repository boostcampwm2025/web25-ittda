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

export interface UploadMultipleResult {
  successIds: string[];
  // files 배열 기준, 업로드 또는 완료 확정에 실패한 인덱스 (오름차순)
  failedIndices: number[];
}

export const useMediaUpload = () => {
  const [isUploading, setIsUploading] = useState(false);

  /**
   * 여러 파일 업로드 후 성공한 mediaId와 실패한 파일의 인덱스를 반환
   * 일부만 실패한 경우 성공한 파일만 successIds에 담고 failedIndices로 실패 위치를 알려준다.
   * 전부 실패하면 에러를 throw한다.
   */
  const uploadMultipleMedia = async (
    files: File[],
  ): Promise<UploadMultipleResult> => {
    if (files.length === 0) return { successIds: [], failedIndices: [] };
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

      const uploadResults = await Promise.allSettled(
        presignItems.map((item, index) =>
          uploadFileToStorage(
            item.uploadUrl,
            files[index],
            resolveContentType(files[index]),
          ),
        ),
      );

      const succeededIndices: number[] = [];
      const failedIndices: number[] = [];
      uploadResults.forEach((result, index) => {
        if (result.status === 'fulfilled') {
          succeededIndices.push(index);
        } else {
          failedIndices.push(index);
          Sentry.captureException(result.reason, {
            tags: { context: 'media', operation: 'upload-single' },
            extra: {
              fileName: files[index].name,
              fileType: files[index].type,
            },
          });
          logger.error('이미지 업로드 실패', result.reason);
        }
      });

      if (succeededIndices.length === 0) {
        throw new Error('모든 이미지 업로드에 실패했습니다.');
      }

      const succeededMediaIds = succeededIndices.map(
        (index) => presignItems[index].mediaId,
      );
      const completedIds = await postMediaComplete(succeededMediaIds);

      if (completedIds.length === 0) {
        throw new Error('모든 이미지 업로드에 실패했습니다.');
      }

      const completedSet = new Set(completedIds);
      const successIds: string[] = [];
      succeededIndices.forEach((index) => {
        const mediaId = presignItems[index].mediaId;
        if (completedSet.has(mediaId)) {
          successIds.push(mediaId);
        } else {
          failedIndices.push(index);
        }
      });

      return { successIds, failedIndices: failedIndices.sort((a, b) => a - b) };
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
