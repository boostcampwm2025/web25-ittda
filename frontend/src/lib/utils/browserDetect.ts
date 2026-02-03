/**
 * 인앱 브라우저인지 감지
 * 카카오톡, 페이스북, 인스타그램, 라인 등의 인앱 브라우저 감지
 */
export function isInAppBrowser(): boolean {
  if (typeof window === 'undefined') return false;

  const ua = navigator.userAgent || navigator.vendor;

  // 주요 인앱 브라우저 패턴
  const inAppPatterns = [
    'KAKAOTALK', // 카카오톡
    'KAKAO', // 카카오
    'FB_IAB', // 페이스북 인앱 브라우저
    'FBAV', // 페이스북 앱
    'FBAN', // 페이스북 안드로이드
    'Instagram', // 인스타그램
    'Line', // 라인
    'NAVER', // 네이버
    'Snapchat', // 스냅챗
    'Twitter', // 트위터
    'LinkedIn', // 링크드인
  ];

  return inAppPatterns.some((pattern) => ua.includes(pattern));
}

/**
 * 시크릿/프라이빗 모드인지 감지
 */
export async function isPrivateMode(): Promise<boolean> {
  if (typeof window === 'undefined') return false;

  return new Promise((resolve) => {
    // Chrome/Edge - FileSystem API 사용
    if ('storage' in navigator && 'estimate' in navigator.storage) {
      navigator.storage.estimate().then(({ quota }) => {
        // 시크릿 모드에서는 quota가 매우 작음
        resolve(quota !== undefined && quota < 120000000);
      });
      return;
    }

    // Safari - indexedDB 사용
    const testKey = 'test';
    try {
      if ('indexedDB' in window) {
        const db = indexedDB.open(testKey);
        db.onsuccess = () => {
          resolve(false);
        };
        db.onerror = () => {
          resolve(true);
        };
      } else {
        resolve(false);
      }
    } catch {
      resolve(true);
    }

    // 타임아웃 처리
    setTimeout(() => resolve(false), 100);
  });
}
