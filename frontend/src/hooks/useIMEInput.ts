import { useRef } from 'react';

/**
 * Android Capacitor WebView에서 한국어 등 IME 조합 입력 시 마지막 글자가 잘리는 문제를 방지하는 hook.
 *
 * 원인: Android WebView에서 React controlled input의 onChange가 IME 조합 중에 state를
 *       업데이트하면 Android IME 버퍼가 리셋되어 조합 중인 글자가 사라짐.
 *       (데스크탑 브라우저는 composition 중 update를 차단하면 오히려 입력이 안 되므로 적용 안 함)
 *
 * 해결: Android에서만 조합 중(onCompositionStart~onCompositionEnd)에 state 업데이트를 차단하고,
 *       조합 완료 시점에만 최종 값으로 업데이트.
 *
 * 사용법:
 *   const imeProps = useIMEInput(setValue);
 *   <input value={value} {...imeProps} />
 */

function isAndroidCapacitor() {
  return (
    typeof window !== 'undefined' &&
    (window as unknown as { Capacitor?: { getPlatform?: () => string } })
      .Capacitor?.getPlatform?.() === 'android'
  );
}

export function useIMEInput(onChange: (value: string) => void) {
  const isComposingRef = useRef(false);
  const isAndroid = isAndroidCapacitor();

  return {
    onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      if (!isAndroid || !isComposingRef.current) {
        onChange(e.target.value);
      }
    },
    onCompositionStart: () => {
      isComposingRef.current = true;
    },
    onCompositionEnd: (e: React.CompositionEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      isComposingRef.current = false;
      if (isAndroid) {
        onChange((e.target as HTMLInputElement | HTMLTextAreaElement).value);
      }
    },
  };
}
