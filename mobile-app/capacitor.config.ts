import type { CapacitorConfig } from '@capacitor/cli';

const serverUrl = process.env.CAPACITOR_SERVER_URL;
const isLocal = !!serverUrl && !serverUrl.startsWith('https://ittda.vercel.app');

const config: CapacitorConfig = {
  appId: 'com.ittda.app',
  appName: '잇다',
  webDir: 'src',
  server: {
    url: serverUrl || 'https://ittda.vercel.app',
    androidScheme: isLocal ? 'http' : 'https',
    ...(isLocal ? { cleartext: true } : {}),
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
    captureInput: false,
    webContentsDebuggingEnabled: isLocal,
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
      resize: 'none',
      scrollAssist: false,
    },
  },
};

export default config;
