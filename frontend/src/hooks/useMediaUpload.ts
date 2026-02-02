import {
  postMediaPresign,
  uploadFileToStorage,
  postMediaComplete,
} from '@/lib/api/presignMedia';
import { getImageDimensions } from '@/lib/utils/image';
import { useState } from 'react';
import * as Sentry from '@sentry/nextjs';

export const useMediaUpload = () => {
  const [isUploading, setIsUploading] = useState(false);

  const uploadMultipleMedia = async (files: File[]): Promise<string[]> => {
    if (files.length === 0) return [];
    setIsUploading(true);

    try {
      // Presign URL들 가져오기
      const fileInfos = await Promise.all(
        files.map(async (f) => ({
          file: f,
          dimensions: await getImageDimensions(f),
        })),
      );

      const presignItems = await postMediaPresign(
        fileInfos.map(({ file, dimensions }) => ({
          contentType: file.type,
          size: file.size,
          width: dimensions.width,
        })),
      );

      // URL로 실제 파일 업로드
      await Promise.all(
        presignItems.map((item, index) =>
          uploadFileToStorage(item.uploadUrl, files[index]),
        ),
      );

      // 모든 mediaId에 대해 완료 확정 요청
      const mediaIds = presignItems.map((item) => item.mediaId);
      const successIds = await postMediaComplete(mediaIds);

      return successIds; // 최종적으로 전달할 mediaId 배열 반환
    } catch (error) {
      Sentry.captureException(error, {
        tags: {
          context: 'media',
          operation: 'upload-multiple',
        },
        extra: {
          filesCount: files.length,
          fileTypes: files.map((f) => f.type),
          totalSize: files.reduce((sum, f) => sum + f.size, 0),
        },
      });
      console.error('Media Upload Error:', error);
      throw error;
    } finally {
      setIsUploading(false);
    }
  };

  return { uploadMultipleMedia, isUploading };
};
