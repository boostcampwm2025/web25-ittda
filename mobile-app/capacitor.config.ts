import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.ittda.app',
  appName: '잇다',
  webDir: 'src',
  server: {
    url: 'https://ittda.vercel.app',
    cleartext: false,
    androidScheme: 'https',
    allowNavigation: ['ittda.vercel.app', 'ittda-be.o-r.kr'],
  },
  ios: {
    scrollEnabled: true,
    allowsLinkPreview: false,
    contentInset: 'never',
    // Google OAuth는 WKWebView를 차단하므로 Safari로 인식되도록 UA 설정
    overrideUserAgent:
      'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1',
  },
  android: {
    allowMixedContent: false,
    captureInput: true,
    webContentsDebuggingEnabled: false,
  },
};

export default config;
