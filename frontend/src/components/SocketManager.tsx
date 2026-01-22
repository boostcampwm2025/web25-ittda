'use client';

import { useEffect } from 'react';
import { useSocketStore } from '@/store/useSocketStore';
export default function SocketManager() {
  const { connectSocket } = useSocketStore();

  // 소켓 연결
  useEffect(() => {
    connectSocket();
  }, [connectSocket]);

  return null;
}
