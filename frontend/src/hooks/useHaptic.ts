import { useCallback, useRef } from 'react';

const isIOS = () => {
  if (typeof navigator === 'undefined') return false;
  const iOSDevice = /iPad|iPhone|iPod/.test(navigator.userAgent);
  // iPadOS 13+는 userAgent에 "iPad"가 없고 MacIntel로 표시됨
  const iPadOS =
    navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1;
  return iOSDevice || iPadOS;
};

export function useHaptic() {
  const labelElRef = useRef<HTMLLabelElement | null>(null);

  const getLabelEl = useCallback((): HTMLLabelElement | null => {
    if (labelElRef.current) return labelElRef.current;
    if (typeof document === 'undefined') return null;

    const input = document.createElement('input');
    input.type = 'checkbox';
    input.id = '__haptic_trigger';
    // iOS 18+ WebKit이 switch 타입 체크박스를 토글할 때만 햅틱을 발생시킴
    input.setAttribute('switch', '');
    input.style.cssText =
      'position:fixed;opacity:0;pointer-events:none;width:0;height:0';

    const label = document.createElement('label');
    label.htmlFor = '__haptic_trigger';
    label.style.cssText =
      'position:fixed;opacity:0;pointer-events:none;width:0;height:0';

    document.body.appendChild(input);
    document.body.appendChild(label);
    labelElRef.current = label;
    return label;
  }, []);

  const trigger = useCallback(
    (duration = 30) => {
      try {
        if (isIOS()) {
          // iOS: hidden switch checkbox toggle → Taptic Engine 발동
          getLabelEl()?.click();
        } else if (navigator.vibrate) {
          navigator.vibrate(duration);
        }
      } catch {}
    },
    [getLabelEl],
  );

  return { trigger };
}
