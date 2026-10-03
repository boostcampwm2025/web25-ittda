import type { CapacitorConfig } from '@capacitor/cli';

const productionWebUrl = 'https://ittda.vercel.app';
const serverUrl = process.env.CAPACITOR_SERVER_URL || productionWebUrl;
const parsedServerUrl = new URL(serverUrl);
const usesCleartext = parsedServerUrl.protocol === 'http:';
const isDevelopmentServer = serverUrl !== productionWebUrl;

const config: CapacitorConfig = {
  appId: 'com.ittda.app',
  appName: '잇다',
  webDir: 'src',
  server: {
    url: serverUrl,
    androidScheme: usesCleartext ? 'http' : 'https',
    ...(usesCleartext ? { cleartext: true } : {}),
    allowNavigation: [parsedServerUrl.hostname],
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
    webContentsDebuggingEnabled: isDevelopmentServer,
  },
  plugins: {
    CapacitorHttp: {
      enabled: false,
    },
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
