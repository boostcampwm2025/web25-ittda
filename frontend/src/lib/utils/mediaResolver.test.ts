import { describe, it, expect, vi, afterEach } from 'vitest';
import type { Block } from '../types/record';

const postMock = vi.fn();
vi.mock('@/lib/api/api', () => ({
  post: (...args: unknown[]) => postMock(...args),
}));

const captureExceptionMock = vi.fn();
vi.mock('@sentry/nextjs', () => ({
  captureException: (...args: unknown[]) => captureExceptionMock(...args),
}));

const loggerErrorMock = vi.fn();
vi.mock('./logger', () => ({
  logger: { error: (...args: unknown[]) => loggerErrorMock(...args) },
}));

import { isImageBlock, resolveMediaInBlocks } from './mediaResolver';

function imageBlock(mediaIds: string[]): Block {
  return {
    id: 'img-1',
    type: 'IMAGE',
    value: { mediaIds },
    layout: { row: 1, col: 1, span: 1 },
  };
}

function textBlock(): Block {
  return {
    id: 'text-1',
    type: 'TEXT',
    value: { text: '내용' },
    layout: { row: 2, col: 1, span: 1 },
  };
}

describe('isImageBlock', () => {
  it('type이 IMAGE면 true를 반환한다', () => {
    expect(isImageBlock(imageBlock(['m1']))).toBe(true);
  });

  it('type이 IMAGE가 아니면 false를 반환한다', () => {
    expect(isImageBlock(textBlock())).toBe(false);
  });
});

describe('resolveMediaInBlocks', () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it('이미지 블록이 없으면 원본 블록을 그대로 반환한다', async () => {
    const blocks = [textBlock()];
    const result = await resolveMediaInBlocks(blocks);

    expect(result).toBe(blocks);
    expect(postMock).not.toHaveBeenCalled();
  });

  it('API 성공 시 이미지 블록에 resolvedUrls를 주입한다', async () => {
    postMock.mockResolvedValue({
      success: true,
      data: { items: [{ mediaId: 'm1', url: 'https://cdn/m1.png' }] },
    });
    const blocks = [imageBlock(['m1']), textBlock()];

    const result = await resolveMediaInBlocks(blocks);

    expect(result[0].value).toMatchObject({
      mediaIds: ['m1'],
      resolvedUrls: ['https://cdn/m1.png'],
    });
    expect(result[1]).toBe(blocks[1]);
  });

  it('API 응답이 실패(success:false)면 원본 블록을 반환한다', async () => {
    postMock.mockResolvedValue({ success: false });
    const blocks = [imageBlock(['m1'])];

    const result = await resolveMediaInBlocks(blocks);

    expect(result).toBe(blocks);
  });

  it('API 호출이 예외를 던지면 Sentry/logger에 기록하고 원본 블록을 반환한다', async () => {
    const error = new Error('네트워크 오류');
    postMock.mockRejectedValue(error);
    const blocks = [imageBlock(['m1'])];

    const result = await resolveMediaInBlocks(blocks);

    expect(result).toBe(blocks);
    expect(captureExceptionMock).toHaveBeenCalledWith(
      error,
      expect.objectContaining({
        tags: expect.objectContaining({ context: 'media-resolver' }),
      }),
    );
    expect(loggerErrorMock).toHaveBeenCalledWith('Media Resolve', error);
  });
});
