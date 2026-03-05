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
  },
  android: {
    allowMixedContent: false,
    captureInput: true,
    webContentsDebuggingEnabled: false,
  },
};

export default config;
