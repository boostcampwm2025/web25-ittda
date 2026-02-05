import { io, Socket } from 'socket.io-client';

let socketInstance: Socket | null = null;

export const getSocketInstance = (token?: string): Socket => {
  const baseUrl = process.env.NEXT_PUBLIC_API_URL || '';

  if (!socketInstance) {
    socketInstance = io(baseUrl, {
      transports: ['websocket'],
      withCredentials: true,
      autoConnect: false,
      reconnection: false, // store에서 제어
      auth: token ? { token } : undefined,
    });

    return socketInstance;
  }

  // 기존 인스턴스 토큰 갱신 지원
  if (token) {
    socketInstance.auth = { token };
  }

  return socketInstance;
};

export const updateSocketToken = (token: string) => {
  if (!socketInstance) return;

  socketInstance.auth = { token };
};

export const destroySocketInstance = () => {
  if (!socketInstance) return;

  socketInstance.removeAllListeners();
  socketInstance.disconnect();
  socketInstance = null;
};
