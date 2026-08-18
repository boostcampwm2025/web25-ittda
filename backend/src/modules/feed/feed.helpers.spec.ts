import { BadRequestException } from '@nestjs/common';
import { decodeFeedCursor, encodeFeedCursor } from './feed.helpers';

describe('decodeFeedCursor', () => {
  it('커서가 없으면 null을 반환한다(첫 페이지)', () => {
    expect(decodeFeedCursor(undefined)).toBeNull();
    expect(decodeFeedCursor(null)).toBeNull();
    expect(decodeFeedCursor('')).toBeNull();
  });

  it('encodeFeedCursor로 만든 커서를 그대로 복원한다', () => {
    const eventAt = new Date('2026-01-01T00:00:00.000Z');
    const cursor = encodeFeedCursor(eventAt, 'post-1');

    expect(decodeFeedCursor(cursor)).toEqual({ eventAt, id: 'post-1' });
  });

  it('base64로도 JSON으로도 해석할 수 없는 커서는 400으로 실패한다', () => {
    expect(() => decodeFeedCursor('!!!not-base64-or-json!!!')).toThrow(
      BadRequestException,
    );
  });

  it('eventAt/id가 빠진 커서는 400으로 실패한다', () => {
    const cursor = Buffer.from(
      JSON.stringify({ id: 'post-1' }),
      'utf-8',
    ).toString('base64');
    expect(() => decodeFeedCursor(cursor)).toThrow(BadRequestException);
  });

  it('eventAt이 파싱 불가능한 날짜면 400으로 실패한다', () => {
    const cursor = Buffer.from(
      JSON.stringify({ eventAt: 'not-a-date', id: 'post-1' }),
      'utf-8',
    ).toString('base64');
    expect(() => decodeFeedCursor(cursor)).toThrow(BadRequestException);
  });

  it('존재하지 않는 날짜(2월 30일 등)로 정규화되는 커서는 400으로 실패한다', () => {
    // new Date('2026-02-30...')는 NaN이 아니라 2026-03-02로 조용히 보정된다.
    // encodeFeedCursor가 만드는 문자열과 왕복 비교해 이런 값을 걸러내야 한다.
    const cursor = Buffer.from(
      JSON.stringify({ eventAt: '2026-02-30T00:00:00.000Z', id: 'post-1' }),
      'utf-8',
    ).toString('base64');
    expect(() => decodeFeedCursor(cursor)).toThrow(BadRequestException);
  });

  it('커서 없음(null)과 손상된 커서를 조용히 같은 값으로 뭉개지 않는다', () => {
    // 손상된 커서를 그냥 null로 돌려주면 "첫 페이지부터 다시"와 구분이
    // 안 돼서, 클라이언트가 무한 재요청에 빠지는 문제(회귀 대상)를 방지.
    expect(decodeFeedCursor(undefined)).toBeNull();
    expect(() => decodeFeedCursor('corrupted')).toThrow(BadRequestException);
  });
});
