import { describe, it, expect, afterEach } from 'vitest';
import { getCookieFromString, setCookie, getCookie, deleteCookie } from './cookie';

function stubCookieSetter() {
  let captured = '';
  Object.defineProperty(document, 'cookie', {
    configurable: true,
    set: (v: string) => {
      captured = v;
    },
    get: () => captured,
  });
  return () => captured;
}

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

describe('setCookie', () => {
  afterEach(() => {
    Reflect.deleteProperty(document, 'cookie');
  });

  it('name과 value를 인코딩해서 쿠키 문자열을 만든다', () => {
    const getCaptured = stubCookieSetter();

    setCookie('user name', 'hello world');

    expect(getCaptured()).toContain(
      `${encodeURIComponent('user name')}=${encodeURIComponent('hello world')}`,
    );
  });

  it('기본 옵션(days, path, sameSite, secure)이 적용된다', () => {
    const getCaptured = stubCookieSetter();

    setCookie('token', 'abc');

    expect(getCaptured()).toContain('expires=');
    expect(getCaptured()).toContain('path=/');
    expect(getCaptured()).toContain('SameSite=Lax');
    expect(getCaptured()).toContain('Secure');
  });

  it('days가 0이면 expires를 설정하지 않는다', () => {
    const getCaptured = stubCookieSetter();

    setCookie('token', 'abc', { days: 0 });

    expect(getCaptured()).not.toContain('expires=');
  });

  it('secure가 false이면 Secure를 붙이지 않는다', () => {
    const getCaptured = stubCookieSetter();

    setCookie('token', 'abc', { secure: false });

    expect(getCaptured()).not.toContain('Secure');
  });

  it('path와 sameSite 옵션을 지정하면 해당 값으로 설정한다', () => {
    const getCaptured = stubCookieSetter();

    setCookie('token', 'abc', { path: '/admin', sameSite: 'Strict' });

    expect(getCaptured()).toContain('path=/admin');
    expect(getCaptured()).toContain('SameSite=Strict');
  });
});

describe('getCookie', () => {
  afterEach(() => {
    document.cookie = 'token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/';
    document.cookie = `${encodeURIComponent('key')}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/`;
  });

  it('쿠키가 존재하면 값을 반환한다', () => {
    document.cookie = 'token=abc123';
    expect(getCookie('token')).toBe('abc123');
  });

  it('쿠키가 없으면 null을 반환한다', () => {
    expect(getCookie('notExist')).toBeNull();
  });

  it('URL 인코딩된 값을 디코딩해서 반환한다', () => {
    document.cookie = `${encodeURIComponent('key')}=${encodeURIComponent('hello world')}`;
    expect(getCookie('key')).toBe('hello world');
  });
});

describe('deleteCookie', () => {
  afterEach(() => {
    Reflect.deleteProperty(document, 'cookie');
  });

  it('만료된 expires로 쿠키 삭제를 요청한다', () => {
    const getCaptured = stubCookieSetter();

    deleteCookie('token');

    expect(getCaptured()).toContain('token=');
    expect(getCaptured()).toContain('path=/');
  });

  it('path 옵션을 지정하면 해당 path로 삭제를 요청한다', () => {
    const getCaptured = stubCookieSetter();

    deleteCookie('token', '/admin');

    expect(getCaptured()).toContain('path=/admin');
  });
});
