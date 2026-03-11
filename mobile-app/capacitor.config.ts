import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.ittda.app',
  appName: '잇다',
  webDir: 'src',
  server: {
    // 로컬 테스트용 — 배포 전 반드시 https://ittda.vercel.app 으로 되돌릴 것
    url: 'http://localhost:3000',
    cleartext: true,
    androidScheme: 'http',
    allowNavigation: ['ittda.vercel.app', 'ittda-be.o-r.kr', 'localhost'],
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
  plugins: {
    SplashScreen: {
      launchShowDuration: 0,
      launchAutoHide: false, // JS에서 직접 hide() 호출
      backgroundColor: '#10B981',
      androidSplashResourceName: 'splash',
      showSpinner: false,
    },
    Keyboard: {
      resize: 'body',
      scrollAssist: false,
    },
  },
};

export default config;
