'use client';

import { useSyncExternalStore } from 'react';

// 모듈 레벨 싱글턴 — Header/WeekCalendar 등 여러 소비자가 동일한 hidden 값을
// 즉시 읽도록 공유. useState 기반 독립 인스턴스는 나중에 마운트된 소비자가
// 이미 scroll이 내려간 상태에서 hidden=false로 시작하는 불일치 문제가 있었다.
let _hidden = false;
let _lastY = 0;
let _ticking = false;
const _subscribers = new Set<() => void>();

function _handleScroll() {
  if (_ticking) return;
  _ticking = true;
  requestAnimationFrame(() => {
    const y = window.scrollY;
    const delta = y - _lastY;

    if (y < 16) {
      if (_hidden) {
        _hidden = false;
        _subscribers.forEach((fn) => fn());
      }
      _lastY = y;
    } else if (Math.abs(delta) > 4) {
      const next = delta > 0;
      if (next !== _hidden) {
        _hidden = next;
        _subscribers.forEach((fn) => fn());
      }
      _lastY = y;
    }
    _ticking = false;
  });
}

function _subscribe(onStoreChange: () => void) {
  let resetHidden = false;
  if (_subscribers.size === 0) {
    _lastY = window.scrollY;
    if (_lastY < 16 && _hidden) {
      _hidden = false;
      resetHidden = true;
    }
    window.addEventListener('scroll', _handleScroll, { passive: true });
  }
  _subscribers.add(onStoreChange);
  // 구독 등록 전에 hidden이 리셋됐다면 새 구독자에게 즉시 알림
  if (resetHidden) {
    onStoreChange();
  }
  return () => {
    _subscribers.delete(onStoreChange);
    if (_subscribers.size === 0) {
      window.removeEventListener('scroll', _handleScroll);
    }
  };
}

const _getSnapshot = () => _hidden;
const _getServerSnapshot = () => false;

export function useHideOnScroll() {
  return useSyncExternalStore(_subscribe, _getSnapshot, _getServerSnapshot);
}
