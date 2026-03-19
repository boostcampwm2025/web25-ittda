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
      accessToken = await refreshAccessToken();
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
      } else {
        Sentry.captureException(err, {
          level: 'error',
          tags: { context: 'socket', operation: 'connect' },
          extra: { message: err.message },
        });
        logger.error('소켓 연결 에러', err);
      }
    });

    socket.on('exception', async (data: SocketExceptionResponse) => {
      // message가 없는 빈 exception은 무시 (백엔드가 payload 없이 exception을 emit하는 경우)
      if (!data?.message) return;

      if (data.message === 'Draft is full.') {
        toast.warning('참여 인원이 가득 찼어요.');
        return;
      }
      // draftId mismatch는 stale LEAVE_DRAFT(React StrictMode cleanup 등)로 인한 오탐이므로 무시.
      // 이 체크는 반드시 'Invalid access token.' 체크보다 앞에 있어야 함.
      // (data.status === 'error'로 모든 WsException을 잡으면 이 분기가 실행되지 않음)
      if (data.message === 'draftId mismatch.') {
        // JOIN_DRAFT가 이후 처리되어 세션이 정상화됨
        return;
      }
      if (data.message === 'Invalid access token.') {
        await handleAuthError();
        return;
      }
      // data.status === 'error'는 모든 WsException에 해당하므로 handleAuthError 트리거 조건으로 사용하지 않음.
      // 인증 무관 예외(Lock owner only., Internal server error 등)에서 socket disconnect가 발생하는 것을 방지.

      Sentry.captureMessage(`소켓 서버 예외: ${data.message}`, {
        level: 'error',
        tags: { context: 'socket', operation: 'server_exception' },
        extra: { serverData: data },
      });
      logger.error('소켓 연결', data);
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
