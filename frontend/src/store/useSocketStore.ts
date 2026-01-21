import { create } from 'zustand';
import { io, Socket } from 'socket.io-client';

interface SocketStore {
  socket: Socket | null;
  isConnected: boolean;
  connectSocket: (accessToken: string) => void;
  disconnectSocket: () => void;
}

export const useSocketStore = create<SocketStore>((set, get) => ({
  socket: null,
  isConnected: false,

  connectSocket: (accessToken: string) => {
    const currentSocket = get().socket;
    if (currentSocket?.connected) return;

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
    socket.on('connect_error', (err) => {
      console.error('소켓 연결 에러', err.message);
    });

    set({ socket });
  },

  disconnectSocket: () => {
    const { socket } = get();
    if (socket) {
      socket.disconnect();
      set({ socket: null, isConnected: false });
    }
  },
}));
