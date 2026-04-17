// This file configures the initialization of Sentry on the client.
// The added config here will be used whenever a users loads a page in their browser.
// https://docs.sentry.io/platforms/javascript/guides/nextjs/

import * as Sentry from '@sentry/nextjs';

Sentry.init({
  dsn: 'https://3b4171913799a34232d6d4f273783ce4@o4510817007501312.ingest.us.sentry.io/4510817061765121',

  // Only enable Sentry in production
  enabled: process.env.NODE_ENV === 'production',

  // Replay는 초기 로드 시 번들에 포함되지 않도록 지연 로딩
  integrations: [],

  // Define how likely traces are sampled. Adjust this value in production, or use tracesSampler for greater control.
  tracesSampleRate: 1,
  // Enable logs to be sent to Sentry
  enableLogs: true,

  // Define how likely Replay events are sampled.
  replaysSessionSampleRate: 0.1,

  // Define how likely Replay events are sampled when an error occurs.
  replaysOnErrorSampleRate: 1.0,

  // Enable sending user PII (Personally Identifiable Information)
  // https://docs.sentry.io/platforms/javascript/guides/nextjs/configuration/options/#sendDefaultPii
  sendDefaultPii: true,
});

// 페이지 로드 완료 후 Replay 초기화 (이미 로드된 Sentry 인스턴스 사용)
if (typeof window !== 'undefined') {
  window.addEventListener('load', () => {
    Sentry.addIntegration(Sentry.replayIntegration());
  });
}

export const onRouterTransitionStart = Sentry.captureRouterTransitionStart;
