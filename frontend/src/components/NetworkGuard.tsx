'use client';

import { useEffect, useState } from 'react';
import { WifiOff } from 'lucide-react';

export default function NetworkGuard() {
  const [isOffline, setIsOffline] = useState(false);

  useEffect(() => {
    let removeListener: (() => void) | undefined;

    async function setup() {
      try {
        const { Network } = await import('@capacitor/network');

        // 초기 상태 확인
        const status = await Network.getStatus();
        setIsOffline(!status.connected);

        // 이후 변경 감지
        const handle = await Network.addListener(
          'networkStatusChange',
          (status) => {
            setIsOffline(!status.connected);
          },
        );
        removeListener = () => handle.remove();
      } catch {
        // Capacitor 미지원 환경(웹 브라우저) → 표준 API 폴백
        const handleOffline = () => setIsOffline(true);
        const handleOnline = () => setIsOffline(false);
        window.addEventListener('offline', handleOffline);
        window.addEventListener('online', handleOnline);
        removeListener = () => {
          window.removeEventListener('offline', handleOffline);
          window.removeEventListener('online', handleOnline);
        };
      }
    }

    setup();
    return () => removeListener?.();
  }, []);

  if (!isOffline) return null;

  return (
    <div className="fixed inset-0 z-[99999] flex flex-col items-center justify-center bg-white dark:bg-[#121212] px-8">
      <div className="flex flex-col items-center gap-4 text-center">
        <div className="w-16 h-16 rounded-full bg-gray-100 dark:bg-white/10 flex items-center justify-center">
          <WifiOff className="w-8 h-8 text-gray-400 dark:text-gray-500" />
        </div>
        <div className="space-y-1.5">
          <p className="text-base font-bold text-gray-900 dark:text-white">
            인터넷 연결을 확인해주세요
          </p>
          <p className="text-sm text-gray-400 leading-relaxed">
            네트워크 연결이 끊어졌습니다.{'\n'}
            연결 후 자동으로 복구됩니다.
          </p>
        </div>
      </div>
    </div>
  );
}
