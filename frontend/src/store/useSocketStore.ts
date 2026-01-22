import { create } from 'zustand';
import { io, Socket } from 'socket.io-client';
import { getAccessToken, refreshAccessToken } from '@/lib/api/auth';

interface SocketStore {
  socket: Socket | null;
  isConnected: boolean;
  sessionId: string | null;
  connectSocket: () => void;
  disconnectSocket: () => void;
  setSessionId: (sessionId: string | null) => void;
}

export const useSocketStore = create<SocketStore>((set, get) => ({
  socket: null,
  isConnected: false,
  sessionId: null,

  connectSocket: async () => {
    const currentSocket = get().socket;
    if (currentSocket?.connected) return;

    let accessToken = getAccessToken();
    if (!accessToken) {
      // 토큰이 없다면 재발급 시도
      accessToken = await refreshAccessToken();
    }

    if (!accessToken) {
      console.error('인증 토큰이 없어 소켓을 연결할 수 없습니다.');
      return;
    }
    const socket = io(process.env.NEXT_PUBLIC_API_URL || '', {
      transports: ['websocket'],
      withCredentials: true,
      auth: {
        token: accessToken,
      },
    });

    socket.on('connect', () => {
      console.debug('소켓 연결 성공', socket.id);
      set({ isConnected: true });
    });

    socket.on('disconnect', () => {
      set({ isConnected: false });
    });

    // 에러 발생 시 처리
    socket.on('connect_error', async (err) => {
      if (err.message === 'Unauthorized') {
        console.debug('소켓 인증 에러 발생, 토큰 재발급 시도...');
        const newToken = await refreshAccessToken();

        if (newToken) {
          // 토큰 갱신 후 재연결
          socket.auth = { token: newToken };
          socket.connect();
        } else {
          // 토큰 모두 만료된 경우
          get().disconnectSocket();
        }
      }
    });
    set({ socket });
  },
  setSessionId: (id: string | null) => set({ sessionId: id }),

  disconnectSocket: () => {
    const { socket } = get();
    if (socket) {
      socket.disconnect();
      set({ socket: null, isConnected: false });
    }
  },
}));
