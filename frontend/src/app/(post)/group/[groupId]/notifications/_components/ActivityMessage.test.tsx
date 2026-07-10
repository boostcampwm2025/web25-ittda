import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { ActivityMessage } from './ActivityMessage';
import type { GroupActivityItem } from '@/lib/types/group';

function activity(overrides: Partial<GroupActivityItem>): GroupActivityItem {
  return {
    id: 'activity-1',
    type: 'POST_CREATE',
    refId: null,
    meta: null,
    createdAt: '2024-06-15T00:00:00.000Z',
    actors: [{ userId: 'u1', nickname: '테스트유저' }],
    ...overrides,
  } as GroupActivityItem;
}

function textOf(item: GroupActivityItem) {
  const { container } = render(<ActivityMessage activity={item} />);
  return container.textContent ?? '';
}

describe('ActivityMessage', () => {
  it('POST_CREATE: 새 기록 작성 문구와 제목을 표시한다', () => {
    const text = textOf(
      activity({ type: 'POST_CREATE', meta: { title: '첫 기록' } }),
    );
    expect(text).toContain('테스트유저');
    expect(text).toContain('새 기록');
    expect(text).toContain('"첫 기록"');
    expect(text).toContain('작성했습니다');
  });

  it('POST_COLLAB_START: 공동 작성 시작 문구를 표시한다', () => {
    const text = textOf(activity({ type: 'POST_COLLAB_START' }));
    expect(text).toContain('공동 작성을 시작했습니다');
  });

  it('POST_COLLAB_COMPLETE: 제목과 함께 작성 완료 문구를 표시한다', () => {
    const text = textOf(
      activity({ type: 'POST_COLLAB_COMPLETE', meta: { title: '완료된 기록' } }),
    );
    expect(text).toContain('"완료된 기록"');
    expect(text).toContain('작성을 완료했습니다');
  });

  it('POST_EDIT_START: 수정 중 문구를 표시한다', () => {
    const text = textOf(
      activity({ type: 'POST_EDIT_START', meta: { title: '수정중 기록' } }),
    );
    expect(text).toContain('"수정중 기록"');
    expect(text).toContain('수정 중입니다');
  });

  it('POST_EDIT_COMPLETE/POST_UPDATE: 제목이 바뀌면 변경 전/후 제목을 함께 표시한다', () => {
    const text = textOf(
      activity({
        type: 'POST_UPDATE',
        meta: { beforeTitle: '이전 제목', afterTitle: '이후 제목' },
      }),
    );
    expect(text).toContain('이전 제목');
    expect(text).toContain('"이후 제목"');
    expect(text).toContain('(으)로 수정했습니다');
  });

  it('POST_UPDATE: 제목이 그대로면 변경 전/후 비교 없이 단순 수정 문구만 표시한다', () => {
    const text = textOf(
      activity({
        type: 'POST_UPDATE',
        meta: { beforeTitle: '같은 제목', afterTitle: '같은 제목' },
      }),
    );
    expect(text).not.toContain('→');
    expect(text).toContain('"같은 제목"');
    expect(text).toContain('기록을');
    expect(text).toContain('수정했습니다');
  });

  it('POST_DELETE: 삭제 문구를 표시한다', () => {
    const text = textOf(
      activity({ type: 'POST_DELETE', meta: { title: '삭제된 기록' } }),
    );
    expect(text).toContain('"삭제된 기록"');
    expect(text).toContain('삭제했습니다');
  });

  it('MEMBER_JOIN: 그룹 참여 문구를 표시한다', () => {
    const text = textOf(activity({ type: 'MEMBER_JOIN' }));
    expect(text).toContain('그룹에 참여했습니다');
  });

  it('MEMBER_LEAVE: 그룹 탈퇴 문구를 표시한다', () => {
    const text = textOf(activity({ type: 'MEMBER_LEAVE' }));
    expect(text).toContain('그룹에서 나갔습니다');
  });

  it('MEMBER_REMOVE: 강제 퇴장 문구를 표시한다', () => {
    const text = textOf(activity({ type: 'MEMBER_REMOVE' }));
    expect(text).toContain('그룹에서 내보내졌습니다');
  });

  it('MEMBER_ROLE_CHANGE: 역할 변경 문구를 표시한다', () => {
    const text = textOf(activity({ type: 'MEMBER_ROLE_CHANGE' }));
    expect(text).toContain('역할이 변경되었습니다');
  });

  it('MEMBER_NICKNAME_CHANGE: 변경 전/후 닉네임을 함께 표시한다', () => {
    const text = textOf(
      activity({
        type: 'MEMBER_NICKNAME_CHANGE',
        meta: { beforeNickname: '이전닉', afterNickname: '이후닉' },
      }),
    );
    expect(text).toContain('이전닉');
    expect(text).toContain('"이후닉"');
    expect(text).toContain('변경했습니다');
  });

  it('GROUP_NAME_UPDATE: actor 없이 새 그룹 이름만 표시한다', () => {
    const text = textOf(
      activity({ type: 'GROUP_NAME_UPDATE', meta: { afterName: '새 그룹명' } }),
    );
    expect(text).toContain('"새 그룹명"');
    expect(text).toContain('변경되었습니다');
    expect(text).not.toContain('테스트유저');
  });

  it('GROUP_COVER_UPDATE: 커버 변경 문구를 표시한다', () => {
    const text = textOf(activity({ type: 'GROUP_COVER_UPDATE' }));
    expect(text).toContain('그룹 커버 사진을 변경했습니다');
  });

  it('GROUP_MONTH_COVER_UPDATE: 월 커버 변경 문구와 제목을 표시한다', () => {
    const text = textOf(
      activity({ type: 'GROUP_MONTH_COVER_UPDATE', meta: { title: '2024-06' } }),
    );
    expect(text).toContain('"2024-06"');
    expect(text).toContain('월 커버 사진을');
    expect(text).toContain('변경했습니다');
  });

  it('GROUP_CREATE: 그룹 생성 문구를 표시한다', () => {
    const text = textOf(activity({ type: 'GROUP_CREATE' }));
    expect(text).toContain('그룹을 만들었습니다');
  });

  it('알 수 없는 타입은 기본 활동 문구로 대체된다', () => {
    const text = textOf(
      activity({ type: 'UNKNOWN_TYPE' as unknown as GroupActivityItem['type'] }),
    );
    expect(text).toContain('새로운 활동이 있습니다');
  });

  it('actor가 여러 명이면 "이름님 외 N명"으로 요약해 표시한다', () => {
    const text = textOf(
      activity({
        type: 'MEMBER_JOIN',
        actors: [
          { userId: 'u1', nickname: 'A' },
          { userId: 'u2', nickname: 'B' },
          { userId: 'u3', nickname: 'C' },
        ],
      }),
    );
    expect(text).toContain('A');
    expect(text).toContain('님 외 2명');
  });
});
