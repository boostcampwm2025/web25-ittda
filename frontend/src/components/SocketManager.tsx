'use client';

import { useEffect } from 'react';
import { useSocketStore } from '@/store/useSocketStore';

export default function SocketManager() {
  useEffect(() => {
    useSocketStore.getState().connectSocket();
  }, []); // "한 번만 mount되면 된다"

  return null;
}
