import { describe, it, expect } from 'vitest';
import { getCookieFromString } from './cookie';

describe('getCookieFromString', () => {
  it('단일 쿠키에서 값을 반환한다', () => {
    expect(getCookieFromString('token=abc123', 'token')).toBe('abc123');
  });

  it('여러 쿠키 중 해당하는 값을 반환한다', () => {
    const cookieStr = 'token=abc123; userId=42; theme=dark';
    expect(getCookieFromString(cookieStr, 'userId')).toBe('42');
  });

  it('쿠키 이름이 없으면 null을 반환한다', () => {
    expect(getCookieFromString('token=abc123', 'notExist')).toBeNull();
  });

  it('빈 쿠키 문자열이면 null을 반환한다', () => {
    expect(getCookieFromString('', 'token')).toBeNull();
  });

  it('URL 인코딩된 값을 디코딩해서 반환한다', () => {
    const encoded = encodeURIComponent('hello world');
    const name = encodeURIComponent('key');
    expect(getCookieFromString(`${name}=${encoded}`, 'key')).toBe('hello world');
  });

  it('쿠키 이름이 다른 쿠키의 접두사여도 정확히 매칭한다', () => {
    const cookieStr = 'token=abc; tokenExtra=xyz';
    expect(getCookieFromString(cookieStr, 'token')).toBe('abc');
  });

  it('공백이 포함된 쿠키 문자열을 파싱한다', () => {
    const cookieStr = '  token=abc123  ; userId=42';
    expect(getCookieFromString(cookieStr, 'token')).toBe('abc123');
  });
});
