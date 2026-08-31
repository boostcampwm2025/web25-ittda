/**
 * captureInput: false (Capacitor Android 설정) 환경에서는 WebView가 표준 IME를
 * 직접 처리하므로 조합 차단 없이 onChange를 그대로 전달합니다.
 *
 * 브라우저(데스크톱/iOS)에서는 compositionEnd로 최종값을 보장합니다.
 *
 * 사용법:
 *   const imeProps = useIMEInput(setValue);
 *   <input value={value} {...imeProps} />
 */

type InputElement = HTMLInputElement | HTMLTextAreaElement;

export function useIMEInput(onChange: (value: string) => void) {
  return {
    onChange: (e: React.ChangeEvent<InputElement>) => {
      onChange(e.target.value);
    },
    onCompositionEnd: (e: React.CompositionEvent<InputElement>) => {
      onChange((e.target as InputElement).value);
    },
  };
}
