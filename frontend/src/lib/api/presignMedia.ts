import { post } from './api';
import { createApiError } from '@/lib/utils/errorHandler';

export interface PresignRequestFile {
  contentType: string;
  size: number;
}

export interface PresignResponseItem {
  mediaId: string;
  uploadUrl: string;
}

/** Presign URL 발급 */
export const postMediaPresign = async (files: PresignRequestFile[]) => {
  const response = await post<{ items: PresignResponseItem[] }>(
    '/api/media/presign',
    {
      files: files.map((f) => ({ contentType: f.contentType, size: f.size })),
    },
  );
  if (!response.success) throw createApiError(response);
  return response.data.items;
};

/** MinIO에 직접 PUT하여 업로드 */
export const uploadFileToStorage = async (
  uploadUrl: string,
  file: File,
  //dimensions: { width: number; height: number },
) => {
  const response = await fetch(uploadUrl, {
    method: 'PUT',
    body: file,
    headers: {
      'Content-Type': file.type,
    },
  });

  if (!response.ok) throw new Error('파일 업로드 실패');
};

/** 업로드 완료 확정 */
export const postMediaComplete = async (mediaIds: string[]) => {
  const response = await post<{ successIds: string[] }>('/api/media/complete', {
    mediaIds,
  });
  if (!response.success) throw createApiError(response);
  return response.data.successIds;
};
