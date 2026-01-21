'use client';

import { useEffect } from 'react';
import { useSocketStore } from '@/store/useSocketStore';
import { getAccessToken } from '@/lib/api/auth';

export default function SocketManager() {
  const { connectSocket } = useSocketStore();

  // 소켓 연결
  useEffect(() => {
    const accessToken = getAccessToken();

    if (accessToken) {
      connectSocket(accessToken);
    }
  }, [connectSocket]);

  return null;
}
