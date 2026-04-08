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

/** MinIO에 직접 PUT하여 업로드
 * Android Capacitor: XMLHttpRequest 사용
 *   → fetch PUT + binary body가 Capacitor HTTP 인터셉터에서 무한 대기에 빠지는 문제 우회
 * 그 외(웹/iOS): 표준 fetch 사용
 */
export const uploadFileToStorage = async (
  uploadUrl: string,
  file: File,
): Promise<void> => {
  const isAndroidCapacitor =
    typeof window !== 'undefined' &&
    (window as unknown as { Capacitor?: { getPlatform?: () => string } })
      .Capacitor?.getPlatform?.() === 'android';

  if (isAndroidCapacitor) {
    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      xhr.open('PUT', uploadUrl);
      xhr.setRequestHeader('Content-Type', file.type);
      xhr.onload = () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          resolve();
        } else {
          reject(new Error(`파일 업로드 실패: ${xhr.status}`));
        }
      };
      xhr.onerror = () => reject(new Error('파일 업로드 실패'));
      xhr.ontimeout = () => reject(new Error('파일 업로드 시간 초과'));
      xhr.timeout = 60000;
      xhr.send(file);
    });
  }

  const res = await fetch(uploadUrl, {
    method: 'PUT',
    body: file,
    headers: { 'Content-Type': file.type },
    signal: AbortSignal.timeout(60000),
  });
  if (!res.ok) throw new Error('파일 업로드 실패');
};

/** 업로드 완료 확정 */
export const postMediaComplete = async (mediaIds: string[]) => {
  const response = await post<{ successIds: string[] }>('/api/media/complete', {
    mediaIds,
  });
  if (!response.success) throw createApiError(response);
  return response.data.successIds;
};
