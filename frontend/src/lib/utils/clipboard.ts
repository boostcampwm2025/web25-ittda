/**
 * 클립보드 복사 유틸리티.
 * Android WebView에서 navigator.clipboard.writeText()가 동작하지 않는 경우
 * textarea + execCommand 폴백을 사용합니다.
 */
export async function copyToClipboard(text: string): Promise<void> {
  if (navigator.clipboard && window.isSecureContext) {
    try {
      await navigator.clipboard.writeText(text);
      return;
    } catch {
      // fall through to execCommand fallback
    }
  }

  // Android WebView 폴백
  const textArea = document.createElement('textarea');
  textArea.value = text;
  textArea.style.cssText =
    'position:fixed;left:-9999px;top:-9999px;opacity:0;';
  document.body.appendChild(textArea);
  textArea.focus();
  textArea.select();
  const success = document.execCommand('copy');
  document.body.removeChild(textArea);
  if (!success) throw new Error('execCommand copy failed');
}
