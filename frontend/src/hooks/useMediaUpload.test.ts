import { describe, it, expect, vi, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';

const {
  postMediaPresignMock,
  uploadFileToStorageMock,
  postMediaCompleteMock,
  getImageDimensionsMock,
  toastErrorMock,
  captureExceptionMock,
} = vi.hoisted(() => ({
  postMediaPresignMock: vi.fn(),
  uploadFileToStorageMock: vi.fn(),
  postMediaCompleteMock: vi.fn(),
  getImageDimensionsMock: vi.fn(),
  toastErrorMock: vi.fn(),
  captureExceptionMock: vi.fn(),
}));

vi.mock('@/lib/api/presignMedia', () => ({
  postMediaPresign: (...args: unknown[]) => postMediaPresignMock(...args),
  uploadFileToStorage: (...args: unknown[]) => uploadFileToStorageMock(...args),
  postMediaComplete: (...args: unknown[]) => postMediaCompleteMock(...args),
}));

vi.mock('@/lib/utils/image', () => ({
  getImageDimensions: (...args: unknown[]) => getImageDimensionsMock(...args),
}));

vi.mock('sonner', () => ({
  toast: { error: (...args: unknown[]) => toastErrorMock(...args) },
}));

vi.mock('@sentry/nextjs', () => ({
  captureException: (...args: unknown[]) => captureExceptionMock(...args),
}));

import { useMediaUpload } from './useMediaUpload';

function makeFile(name: string) {
  return new File(['x'], name, { type: 'image/png' });
}

describe('useMediaUpload.uploadMultipleMedia', () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it('파일이 없으면 즉시 빈 결과를 반환한다', async () => {
    const { result } = renderHook(() => useMediaUpload());

    let uploadResult;
    await act(async () => {
      uploadResult = await result.current.uploadMultipleMedia([]);
    });

    expect(uploadResult).toEqual({ successIds: [], failedIndices: [] });
    expect(postMediaPresignMock).not.toHaveBeenCalled();
  });

  it('모두 성공하면 successIds에 mediaId가 순서대로 담긴다', async () => {
    getImageDimensionsMock.mockResolvedValue({ width: 100, height: 100 });
    postMediaPresignMock.mockResolvedValue([
      { mediaId: 'm1', uploadUrl: 'https://s3/m1' },
    ]);
    uploadFileToStorageMock.mockResolvedValue(undefined);
    postMediaCompleteMock.mockResolvedValue(['m1']);

    const { result } = renderHook(() => useMediaUpload());
    let uploadResult;
    await act(async () => {
      uploadResult = await result.current.uploadMultipleMedia([
        makeFile('a.png'),
      ]);
    });

    expect(uploadResult).toEqual({ successIds: ['m1'], failedIndices: [] });
    expect(result.current.isUploading).toBe(false);
  });

  it('일부 파일 업로드가 실패하면 성공분만 successIds, 실패 인덱스는 failedIndices에 담는다', async () => {
    getImageDimensionsMock.mockResolvedValue({ width: 10, height: 10 });
    postMediaPresignMock.mockResolvedValue([
      { mediaId: 'm1', uploadUrl: 'https://s3/m1' },
      { mediaId: 'm2', uploadUrl: 'https://s3/m2' },
    ]);
    uploadFileToStorageMock
      .mockResolvedValueOnce(undefined)
      .mockRejectedValueOnce(new Error('업로드 실패'));
    postMediaCompleteMock.mockResolvedValue(['m1']);

    const { result } = renderHook(() => useMediaUpload());
    let uploadResult;
    await act(async () => {
      uploadResult = await result.current.uploadMultipleMedia([
        makeFile('a.png'),
        makeFile('b.png'),
      ]);
    });

    expect(uploadResult).toEqual({ successIds: ['m1'], failedIndices: [1] });
    expect(captureExceptionMock).toHaveBeenCalled();
  });

  it('전부 실패하면 에러를 던진다', async () => {
    getImageDimensionsMock.mockResolvedValue({ width: 10, height: 10 });
    postMediaPresignMock.mockResolvedValue([
      { mediaId: 'm1', uploadUrl: 'https://s3/m1' },
    ]);
    uploadFileToStorageMock.mockRejectedValue(new Error('네트워크 오류'));

    const { result } = renderHook(() => useMediaUpload());

    await expect(
      act(async () => {
        await result.current.uploadMultipleMedia([makeFile('a.png')]);
      }),
    ).rejects.toThrow('모든 이미지 업로드에 실패했습니다.');
    expect(result.current.isUploading).toBe(false);
  });

  it('TIMEOUT 에러면 안내 토스트를 띄운다', async () => {
    getImageDimensionsMock.mockResolvedValue({ width: 10, height: 10 });
    const timeoutError = Object.assign(new Error('시간 초과'), {
      code: 'TIMEOUT',
    });
    postMediaPresignMock.mockRejectedValue(timeoutError);

    const { result } = renderHook(() => useMediaUpload());

    // act()로 감싸면 reject 직전에 호출된 mock 기록이 유실되는 테스트 환경
    // 이슈가 있어, 여기서는 act() 없이 직접 await한다.
    await expect(
      result.current.uploadMultipleMedia([makeFile('a.png')]),
    ).rejects.toThrow('시간 초과');

    expect(toastErrorMock).toHaveBeenCalledWith(
      '이미지 업로드 시간이 초과되었습니다.',
      expect.objectContaining({ description: expect.any(String) }),
    );
  });

  it('완료 확정(postMediaComplete)에서 누락된 mediaId는 failedIndices로 옮긴다', async () => {
    getImageDimensionsMock.mockResolvedValue({ width: 10, height: 10 });
    postMediaPresignMock.mockResolvedValue([
      { mediaId: 'm1', uploadUrl: 'https://s3/m1' },
      { mediaId: 'm2', uploadUrl: 'https://s3/m2' },
    ]);
    uploadFileToStorageMock.mockResolvedValue(undefined);
    // m2는 presign/upload는 성공했지만 서버 완료 확정에서 누락됨
    postMediaCompleteMock.mockResolvedValue(['m1']);

    const { result } = renderHook(() => useMediaUpload());
    let uploadResult;
    await act(async () => {
      uploadResult = await result.current.uploadMultipleMedia([
        makeFile('a.png'),
        makeFile('b.png'),
      ]);
    });

    expect(uploadResult).toEqual({ successIds: ['m1'], failedIndices: [1] });
  });
});
