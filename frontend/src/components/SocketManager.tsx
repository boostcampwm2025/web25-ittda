'use client';

import { useEffect } from 'react';
import { useSocketStore } from '@/store/useSocketStore';
export default function SocketManager() {
  const { connectSocket, socket } = useSocketStore();

  // 소켓 연결
  useEffect(() => {
    connectSocket();
  }, [connectSocket]);

  // socket이 null이 되면 재연결 시도
  // (게스트 토큰 갱신 실패 등으로 disconnectSocket 호출 후 복구)
  useEffect(() => {
    if (socket !== null) return;
    const timeout = setTimeout(() => {
      connectSocket();
    }, 2000);
    return () => clearTimeout(timeout);
  }, [socket, connectSocket]);

  return null;
}
