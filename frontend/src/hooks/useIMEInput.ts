import { useRef } from 'react';

/**
 * 한국어 등 IME 조합 입력 시 마지막 글자가 잘리는 문제를 방지하는 hook.
 *
 * 브라우저 표준 동작:
 *   compositionStart → onChange 차단 → compositionEnd 시 최종값 반영
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
