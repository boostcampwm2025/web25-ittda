import { create } from 'zustand';
import { Socket } from 'socket.io-client';
import { getAccessToken, refreshAccessToken } from '@/lib/api/auth';
import { getSocketInstance } from '@/lib/socket/socketSingleton';
import { SocketExceptionResponse } from '@/lib/types/recordCollaboration';
import { toast } from 'sonner';
import * as Sentry from '@sentry/nextjs';
import { logger } from '@/lib/utils/logger';
import { updateSocketToken } from '@/lib/socket/socketSingleton';

interface SocketStore {
  socket: Socket | null;
  isConnected: boolean;
  isConnecting: boolean;
  sessionId: string | null;

  connectSocket: () => Promise<void>;
  disconnectSocket: () => void;
  setSessionId: (sessionId: string | null) => void;
}

export const useSocketStore = create<SocketStore>((set, get) => ({
  socket: null,
  isConnected: false,
  isConnecting: false,
  sessionId: null,

  connectSocket: async () => {
    const { socket, isConnecting } = get();

    if (socket || isConnecting) return;

    set({ isConnecting: true });

    try {
      let accessToken = await getAccessToken();

      if (!accessToken) {
        accessToken = (await refreshAccessToken()) ?? undefined;
      }

      if (!accessToken) {
        const error = new Error('인증 토큰 없음');
        Sentry.captureException(error);
        logger.error(error.message);
        set({ isConnecting: false });
        return;
      }

      const socketInstance = getSocketInstance(accessToken);

      // 이미 연결된 경우
      if (socketInstance.connected) {
        set({
          socket: socketInstance,
          isConnected: true,
          isConnecting: false,
        });
        return;
      }

      // 이벤트 중복 방지
      socketInstance.removeAllListeners();

      socketInstance.on('connect', () => {
        console.debug('소켓 연결 성공', socketInstance.id);

        set({
          socket: socketInstance,
          isConnected: true,
          isConnecting: false,
        });
      });

      socketInstance.on('disconnect', () => {
        set({
          isConnected: false,
        });
      });

      // Auth Refresh 안전 처리
      const handleAuthError = async () => {
        console.debug('토큰 재발급 시도');

        const newToken = await refreshAccessToken();

        if (!newToken) {
          Sentry.captureException(new Error('토큰 전체 만료'));
          get().disconnectSocket();
          return;
        }

        updateSocketToken(newToken);
        socketInstance.connect();
      };

      socketInstance.on('connect_error', async (err: Error) => {
        if (err?.message?.includes('Unauthorized')) {
          await handleAuthError();
          return;
        }

        Sentry.captureException(err);
        logger.error('socket connect error', err);

        set({ isConnecting: false });
      });

      socketInstance.on('exception', async (data: SocketExceptionResponse) => {
        if (data.message === 'Invalid access token.') {
          await handleAuthError();
          return;
        }

        if (data.message === 'draftId mismatch.') {
          toast.warning('동기화 오류로 이전 화면으로 이동합니다.');

          setTimeout(() => {
            window.history.back();
          }, 1500);

          return;
        }

        Sentry.captureMessage(`소켓 예외: ${data.message}`);
        logger.error(String(data));
      });

      socketInstance.connect();
    } catch (error) {
      console.error(error);
      set({ isConnecting: false });
    }
  },

  disconnectSocket: () => {
    const { socket } = get();

    if (socket) {
      socket.removeAllListeners();
      socket.disconnect();

      set({
        socket: null,
        isConnected: false,
        isConnecting: false,
      });
    }
  },

  setSessionId: (id) => set({ sessionId: id }),
}));
