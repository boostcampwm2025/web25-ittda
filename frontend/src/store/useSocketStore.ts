import { create } from 'zustand';
import { io, Socket } from 'socket.io-client';
import { getAccessToken, refreshAccessToken } from '@/lib/api/auth';
import { SocketExceptionResponse } from '@/lib/types/recordCollaboration';
import { toast } from 'sonner';
import * as Sentry from '@sentry/nextjs';
import { logger } from '@/lib/utils/logger';

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

    let accessToken = await getAccessToken();
    if (!accessToken) {
      // 토큰이 없다면 재발급 시도
      accessToken = (await refreshAccessToken()) ?? undefined;
    }

    if (!accessToken) {
      // 인증 토큰이 없으면 소켓 연결 불가 (실시간 기능 사용 불가)
      const error = new Error('인증 토큰이 없어 소켓을 연결할 수 없습니다');
      Sentry.captureException(error, {
        level: 'error',
        tags: {
          context: 'socket',
          operation: 'connect',
        },
      });
      logger.error('인증 토큰이 없어 소켓을 연결할 수 없습니다.');

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

    // 토큰 갱신 및 재연결 함수
    const handleAuthError = async () => {
      console.debug('소켓 인증 에러, 토큰 재발급');
      const newToken = await refreshAccessToken();
      if (newToken) {
        socket.auth = { token: newToken };
        // 연결을 끊고 새 토큰으로 다시 연결
        socket.disconnect().connect();
      } else {
        // 토큰 모두 만료된 경우 - 재로그인 필요
        Sentry.captureException(new Error('소켓 인증 실패: 모든 토큰 만료'), {
          level: 'warning',
          tags: {
            context: 'socket',
            operation: 'auth',
          },
        });
        get().disconnectSocket();
      }
    };

    // 에러 발생 시 처리
    socket.on('connect_error', async (err: { message: string }) => {
      if (err.message === 'Unauthorized' || err.message.includes('token')) {
        await handleAuthError();
      }
    });

    socket.on('exception', async (data: SocketExceptionResponse) => {
      console.error('소켓 서버 예외 발생:', data);

      if (data.message === 'Invalid access token.' || data.status === 'error') {
        await handleAuthError();
        return;
      }
      if (data.message === 'draftId mismatch.') {
        toast.warning('동기화 오류가 발생하여 이전 화면으로 이동합니다.', {
          duration: 1500,
        });

        setTimeout(() => {
          window.history.back();
        }, 1500);
        return;
      }
      
      Sentry.captureException(err, {
        level: 'error',
        tags: {
          context: 'socket',
          operation: 'connect',
        },
        extra: {
          errorMessage: err.message,
        },
      });
      logger.error('소켓 연결', err);
      
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