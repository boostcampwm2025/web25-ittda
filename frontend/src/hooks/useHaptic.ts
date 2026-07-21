import { useCallback, useRef } from 'react';

const isIOS = () =>
  typeof navigator !== 'undefined' &&
  /iPad|iPhone|iPod/.test(navigator.userAgent);

const isNativePlatform = () =>
  typeof window !== 'undefined' &&
  !!(
    window as unknown as { Capacitor?: { isNativePlatform?: () => boolean } }
  ).Capacitor?.isNativePlatform?.();

export function useHaptic() {
  const labelElRef = useRef<HTMLLabelElement | null>(null);

  const getLabelEl = useCallback((): HTMLLabelElement | null => {
    if (labelElRef.current) return labelElRef.current;
    if (typeof document === 'undefined') return null;

    const input = document.createElement('input');
    input.type = 'checkbox';
    input.id = '__haptic_trigger';
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
      // Capacitor 네이티브 앱: navigator.vibrate는 네이티브 VIBRATE 권한 등
      // 웹 API만으로는 보장이 안 되므로 네이티브 브릿지를 직접 호출한다.
      if (isNativePlatform()) {
        import('@capacitor/haptics')
          .then(({ Haptics, ImpactStyle }) =>
            Haptics.impact({ style: ImpactStyle.Light }),
          )
          .catch(() => {});
        return;
      }

      try {
        if (isIOS()) {
          // iOS 웹: hidden checkbox toggle → Taptic Engine 발동
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
