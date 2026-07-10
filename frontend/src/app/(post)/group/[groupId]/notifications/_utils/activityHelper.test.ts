import { describe, it, expect } from 'vitest';
import { getActorText, getActorParts, getActivityTypeTheme } from './activityHelper';
import type { GroupActivityActor } from '@/lib/types/group';

describe('getActorText', () => {
  it('actor가 1명이면 "이름님"을 반환한다', () => {
    expect(getActorText([{ nickname: '홍길동' }])).toBe('홍길동님');
  });

  it('groupNickname이 있으면 nickname보다 우선한다', () => {
    expect(
      getActorText([{ nickname: '전역닉', groupNickname: '그룹닉' }]),
    ).toBe('그룹닉님');
  });

  it('닉네임이 전부 없으면 "익명님"을 반환한다', () => {
    expect(getActorText([{}])).toBe('익명님');
  });

  it('actor가 여러 명이면 "이름님 외 N명"을 반환한다', () => {
    const actors: GroupActivityActor[] = [
      { nickname: 'A' },
      { nickname: 'B' },
      { nickname: 'C' },
    ];
    expect(getActorText(actors)).toBe('A님 외 2명');
  });

  it('actor가 3명을 초과해도 최대 3명까지만 인원수 계산에 반영한다', () => {
    const actors: GroupActivityActor[] = Array.from({ length: 5 }, (_, i) => ({
      nickname: `유저${i}`,
    }));
    expect(getActorText(actors)).toBe('유저0님 외 2명');
  });
});

describe('getActorParts', () => {
  it('actor가 1명이면 name과 suffix("님")를 분리해 반환한다', () => {
    expect(getActorParts([{ nickname: '홍길동' }])).toEqual({
      name: '홍길동',
      suffix: '님',
    });
  });

  it('actor가 여러 명이면 첫 번째 이름과 "님 외 N명" suffix를 반환한다', () => {
    const actors: GroupActivityActor[] = [{ nickname: 'A' }, { nickname: 'B' }];
    expect(getActorParts(actors)).toEqual({
      name: 'A',
      suffix: '님 외 1명',
    });
  });
});

describe('getActivityTypeTheme', () => {
  it('알려진 활동 타입에 대해 아이콘/색상 테마를 반환한다', () => {
    const theme = getActivityTypeTheme('MEMBER_JOIN');
    expect(theme.bgColor).toContain('indigo');
    expect(theme.iconColor).toContain('indigo');
  });

  it('알 수 없는 타입은 기본(회색) 테마로 대체된다', () => {
    const theme = getActivityTypeTheme('UNKNOWN_TYPE');
    expect(theme.bgColor).toContain('gray');
    expect(theme.iconColor).toContain('gray');
  });
});
