/**
 * 클립보드 복사 유틸리티.
 *
 * Android Capacitor WebView에서 navigator.clipboard.writeText()가
 * 예외 없이 resolve되지만 실제 클립보드에 쓰지 않는 문제가 있어,
 * Android Capacitor에서는 @capacitor/clipboard 네이티브 플러그인을 사용합니다.
 */
function isAndroidCapacitor() {
  return (
    typeof window !== 'undefined' &&
    (window as unknown as { Capacitor?: { getPlatform?: () => string } })
      .Capacitor?.getPlatform?.() === 'android'
  );
}

export async function copyToClipboard(text: string): Promise<void> {
  if (isAndroidCapacitor()) {
    const { Clipboard } = await import('@capacitor/clipboard');
    await Clipboard.write({ string: text });
    return;
  }

  if (navigator.clipboard && window.isSecureContext) {
    try {
      await navigator.clipboard.writeText(text);
      return;
    } catch {
      // fall through to execCommand fallback
    }
  }

  // 최후 폴백: textarea + execCommand
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
