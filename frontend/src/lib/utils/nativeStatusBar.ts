const isNativePlatform = () =>
  typeof window !== 'undefined' &&
  !!(
    window as unknown as { Capacitor?: { isNativePlatform?: () => boolean } }
  ).Capacitor?.isNativePlatform?.();

/**
 * Capacitor 네이티브 환경에서의 상태바 높이(px)를 반환한다.
 * globals.css의 `var(--cap-status-bar-height, env(safe-area-inset-top))`와
 * 동일한 값을 JS에서 읽기 위해, 같은 CSS 표현식을 숨겨진 엘리먼트에 적용하고
 * 계산된 padding 값을 읽는다. 브라우저 환경이면 0을 반환한다.
 */
export function getNativeStatusBarOffset(): number {
  if (typeof document === 'undefined' || !isNativePlatform()) return 0;

  const probe = document.createElement('div');
  probe.style.cssText =
    'position:fixed;visibility:hidden;pointer-events:none;padding-top:var(--cap-status-bar-height, env(safe-area-inset-top));';
  document.body.appendChild(probe);
  const value = parseFloat(getComputedStyle(probe).paddingTop) || 0;
  document.body.removeChild(probe);
  return value;
}
