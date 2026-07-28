'use client';

import { useEffect } from 'react';

// 브라우저는 기본적으로 서비스워커 갱신 여부를 최대 24시간 주기로만 확인한다.
// 그 사이엔 예전에 등록된 서비스워커(예: 오래된 firebase-messaging-sw.js)가
// 계속 활성 상태로 남아있어, skipWaiting/clients.claim이 있어도 "갱신 확인" 자체가
// 늦게 일어나 실제 갱신은 한참 뒤에나 반영된다. 앱 진입/포그라운드 복귀 시점마다
// 직접 update()를 호출해 갱신 확인 주기를 앞당긴다.
const CHECK_INTERVAL_MS = 60 * 60 * 1000; // 1시간

function checkForUpdates() {
  navigator.serviceWorker.getRegistrations().then((registrations) => {
    registrations.forEach((registration) =>
      registration.update().catch(() => {}),
    );
  });
}

export default function ServiceWorkerUpdater() {
  useEffect(() => {
    if (!('serviceWorker' in navigator)) return;

    checkForUpdates();

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') checkForUpdates();
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);

    const intervalId = setInterval(checkForUpdates, CHECK_INTERVAL_MS);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      clearInterval(intervalId);
    };
  }, []);

  return null;
}
