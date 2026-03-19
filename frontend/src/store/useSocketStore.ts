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
      // message가 없는 빈 exception은 무시
      if (!data?.message) return;

      if (data.message === 'Draft is full.') {
        toast.warning('참여 인원이 가득 찼어요.');
        return;
      }
      // draftId mismatch는 stale LEAVE_DRAFT(React StrictMode cleanup 등)로 인한 오탐이므로 무시.
      if (data.message === 'draftId mismatch.') {
        return;
      }
      if (data.message === 'Invalid access token.') {
        await handleAuthError();
        return;
      }

      // 예상된 WS 예외 — 조용히 무시
      const expectedMessages = [
        'Group membership is required.',
        'Insufficient permission.',
        'groupId must be a UUID.',
        'groupId mismatch.',
        'draftId must be a UUID.',
        'draftId is required.',
        'actorId is invalid.',
        'payload is required.',
        'lockKey is invalid.',
        'Lock owner only.',
        'Session is not initialized.',
        'Draft not found.',
        'User not found.',
      ];
      if (expectedMessages.includes(data.message)) return;

      // 예상치 못한 내부 오류만 Sentry + 로그
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
