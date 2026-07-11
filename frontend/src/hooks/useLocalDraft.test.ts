import { describe, it, expect, afterEach, vi } from 'vitest';
import { renderHook } from '@testing-library/react';
import {
  useLocalDraft,
  getDraftKey,
  PERSONAL_DRAFT_KEY,
} from './useLocalDraft';
import type { RecordBlock } from '@/lib/types/record';

describe('getDraftKey', () => {
  it('groupId가 없으면 개인 draft 키를 반환한다', () => {
    expect(getDraftKey()).toBe(PERSONAL_DRAFT_KEY);
  });

  it('groupId가 있으면 그룹별 draft 키를 반환한다', () => {
    expect(getDraftKey('group-1')).toBe('group-group-1-record-draft');
  });
});

describe('useLocalDraft', () => {
  afterEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
  });

  it('saveDraft로 저장한 뒤 loadDraft로 동일한 내용을 불러온다', () => {
    const { result } = renderHook(() => useLocalDraft('test-key'));
    const blocks: RecordBlock[] = [
      {
        id: 'b1',
        type: 'content',
        value: { text: '본문' },
        layout: { row: 1, col: 1, span: 1 },
      },
    ];

    result.current.saveDraft('제목', blocks);
    const loaded = result.current.loadDraft();

    expect(loaded?.title).toBe('제목');
    expect(loaded?.blocks).toEqual(blocks);
  });

  it('photos 블록은 저장 시 tempUrls를 비운다', () => {
    const { result } = renderHook(() => useLocalDraft('photo-key'));
    const blocks: RecordBlock[] = [
      {
        id: 'p1',
        type: 'photos',
        value: { mediaIds: ['m1'], tempUrls: ['blob:local-preview'] },
        layout: { row: 1, col: 1, span: 1 },
      },
    ];

    result.current.saveDraft('사진 글', blocks);
    const loaded = result.current.loadDraft();

    expect(loaded?.blocks[0].value).toMatchObject({
      mediaIds: ['m1'],
      tempUrls: [],
    });
  });

  it('저장된 draft가 없으면 loadDraft는 null을 반환한다', () => {
    const { result } = renderHook(() => useLocalDraft('empty-key'));
    expect(result.current.loadDraft()).toBeNull();
  });

  it('저장된 값이 손상된 JSON이면 loadDraft는 null을 반환한다', () => {
    localStorage.setItem('broken-key', '{invalid json');
    const { result } = renderHook(() => useLocalDraft('broken-key'));
    expect(result.current.loadDraft()).toBeNull();
  });

  it('clearDraft를 호출하면 저장된 draft가 삭제된다', () => {
    const { result } = renderHook(() => useLocalDraft('clear-key'));
    result.current.saveDraft('제목', []);
    expect(result.current.loadDraft()).not.toBeNull();

    result.current.clearDraft();
    expect(result.current.loadDraft()).toBeNull();
  });
});
