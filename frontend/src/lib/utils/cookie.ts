export function setCookie(
  name: string,
  value: string,
  options: {
    days?: number;
    path?: string;
    sameSite?: 'Strict' | 'Lax' | 'None';
    secure?: boolean;
  } = {},
) {
  const { days = 365, path = '/', sameSite = 'Lax', secure = true } = options;

  let cookieString = `${encodeURIComponent(name)}=${encodeURIComponent(value)}`;

  if (days) {
    const date = new Date();
    date.setTime(date.getTime() + days * 24 * 60 * 60 * 1000);
    cookieString += `; expires=${date.toUTCString()}`;
  }

  cookieString += `; path=${path}`;
  cookieString += `; SameSite=${sameSite}`;

  if (secure) {
    cookieString += '; Secure';
  }

  document.cookie = cookieString;
}

/**
 * 클라이언트 사이드에서 쿠키를 가져오기
 */
export function getCookie(name: string): string | null {
  if (typeof document === 'undefined') {
    return null; // 서버에서는 실행하지 않음
  }

  const nameEQ = encodeURIComponent(name) + '=';
  const cookies = document.cookie.split(';');

  for (let cookie of cookies) {
    cookie = cookie.trim();
    if (cookie.indexOf(nameEQ) === 0) {
      return decodeURIComponent(cookie.substring(nameEQ.length));
    }
  }

  return null;
}

/**
 * 서버 사이드에서 특정 쿠키 가져오기
 */
export function getCookieFromString(
  cookieString: string,
  name: string,
): string | null {
  const nameEQ = encodeURIComponent(name) + '=';
  const cookies = cookieString.split(';');

  for (let cookie of cookies) {
    cookie = cookie.trim();
    if (cookie.indexOf(nameEQ) === 0) {
      return decodeURIComponent(cookie.substring(nameEQ.length));
    }
  }

  return null;
} // 서버에서 쿠키를 읽으려면 next/headers 모듈을 사용

/**
 * 쿠키를 삭제
 */
export function deleteCookie(name: string, path: string = '/') {
  setCookie(name, '', { days: -1, path });
}
