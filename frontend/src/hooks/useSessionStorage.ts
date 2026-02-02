import { useState } from 'react';
import * as Sentry from '@sentry/nextjs';
import { logger } from '@/lib/utils/logger';

/**
 * @param key - sessionStorage 키
 * @param initialValue - 초기값
 * @returns [저장된 값, 값 설정 함수, 값 제거 함수]
 *
 * @example
 * ```tsx
 * const [drafts, setDrafts, clearDrafts] = useSessionStorage('post-draft', {
 *   title: '',
 *   content: ''
 * });
 * ```
 */
export function useSessionStorage<T>(
  key: string,
  initialValue: T,
): [T, (value: T | ((val: T) => T)) => void, () => void] {
  // 클라이언트 사이드에서만 sessionStorage 접근
  const [storedValue, setStoredValue] = useState<T>(() => {
    if (typeof window === 'undefined') {
      return initialValue;
    }

    try {
      const item = window.sessionStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch (error) {
      Sentry.captureException(error, {
        level: 'error',
        tags: {
          context: 'sessionStorage',
          operation: 'read-session-storage',
        },
        extra: {
          storageKey: key,
          initialValue: initialValue,
        },
      });
      logger.error('reading from sessionStorage', error);
      return initialValue;
    }
  });

  // 값 설정 함수
  const setValue = (value: T | ((val: T) => T)) => {
    try {
      const valueToStore =
        value instanceof Function ? value(storedValue) : value;
      setStoredValue(valueToStore);

      if (typeof window !== 'undefined') {
        window.sessionStorage.setItem(key, JSON.stringify(valueToStore));
      }
    } catch (error) {
      Sentry.captureException(error, {
        level: 'error',
        tags: {
          context: 'sessionStorage',
          operation: 'write-session-storage',
        },
        extra: {
          storageKey: key,
          value: value,
        },
      });
      logger.error('writing to sessionStorage', error);
    }
  };

  // 값 제거 함수
  const removeValue = () => {
    try {
      setStoredValue(initialValue);
      if (typeof window !== 'undefined') {
        window.sessionStorage.removeItem(key);
      }
    } catch (error) {
      Sentry.captureException(error, {
        level: 'error',
        tags: {
          context: 'sessionStorage',
          operation: 'remove-session-storage',
        },
        extra: {
          storageKey: key,
        },
      });
      logger.error('removing from sessionStorage', error);
    }
  };

  return [storedValue, setValue, removeValue];
}
