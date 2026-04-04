import { useRef } from 'react';
import { Capacitor } from '@capacitor/core';

/**
 * Android Capacitor WebView에서 한국어 등 IME 조합 입력 시 글자가 잘리는 문제를 방지하는 hook.
 *
 * 핵심 원리:
 *   React는 controlled input에서 `node.value !== props.value`일 때만 DOM을 업데이트한다.
 *   따라서 onChange를 항상 호출해 React state를 IME 현재값과 동기화하면,
 *   React가 DOM을 건드릴 이유가 없어지고 IME 버퍼가 보호된다.
 *
 * Android 전략 (value setter override 대신):
 *   조합 중에도 onChange를 호출해 localQuery = IME 현재값을 유지.
 *   → React re-render 시 `node.value === localQuery` → DOM 업데이트 스킵 → IME 보호.
 *   compositionEnd 이후에는 최종 확정값으로 한 번 더 호출해 확정.
 *
 * 비-Android 전략 (기존 동작 유지):
 *   조합 중 onChange 차단, compositionEnd 시 최종값 반영.
 *
 * 사용법 (ref 없는 컴포넌트):
 *   const imeProps = useIMEInput(setValue);
 *   <input value={value} {...imeProps} />
 *
 * 사용법 (기존 ref가 있는 컴포넌트 - CoreField 등):
 *   const { ref: imeRef, ...imeHandlers } = useIMEInput(onChange);
 *   const setRef = useCallback((el) => { myRef.current = el; imeRef?.(el); }, [imeRef]);
 *   <textarea ref={setRef} {...imeHandlers} />
 */

type InputElement = HTMLInputElement | HTMLTextAreaElement;

export function useIMEInput(onChange: (value: string) => void) {
  const isComposingRef = useRef(false);
  const isAndroid = Capacitor.getPlatform() === 'android';

  // Android: 조합 중에도 onChange를 항상 호출해 React state = IME 현재값 유지.
  // 이렇게 하면 React re-render 시 node.value === localQuery → DOM 업데이트 스킵.
  if (isAndroid) {
    return {
      onChange: (e: React.ChangeEvent<InputElement>) => {
        onChange(e.target.value);
      },
      onCompositionStart: () => {
        isComposingRef.current = true;
      },
      onCompositionEnd: (e: React.CompositionEvent<InputElement>) => {
        isComposingRef.current = false;
        // compositionEnd 시 onChange가 이미 최신 값으로 불렸겠지만,
        // Android에서는 compositionEnd 후 input event가 발생하지 않는 경우가 있어
        // 최종값으로 한 번 더 명시적 호출.
        onChange((e.target as InputElement).value);
      },
    };
  }

  // 비-Android: 조합 중 onChange 차단, compositionEnd 시 최종값 반영 (기존 동작).
  return {
    onChange: (e: React.ChangeEvent<InputElement>) => {
      if (!isComposingRef.current) {
        onChange(e.target.value);
      }
    },
    onCompositionStart: () => {
      isComposingRef.current = true;
    },
    onCompositionEnd: (e: React.CompositionEvent<InputElement>) => {
      isComposingRef.current = false;
      onChange((e.target as InputElement).value);
    },
  };
}
