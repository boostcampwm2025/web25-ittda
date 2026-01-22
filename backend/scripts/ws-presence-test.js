const { io } = require('socket.io-client');

const draftId = process.argv[2] ?? 'draft-1';
const serverUrl = process.env.WS_URL ?? 'http://localhost:4000';
const accessToken = process.env.ACCESS_TOKEN;
const lockKey = process.env.LOCK_KEY;
const heartbeatIntervalMs = Number(process.env.LOCK_HEARTBEAT_MS ?? 10000);
let heartbeatTimer;
let sessionReady = false;

if (!accessToken) {
  console.error('ACCESS_TOKEN is required.');
  process.exit(1);
}

console.log('[start]', { serverUrl, draftId });

const socket = io(serverUrl, {
  auth: {
    token: accessToken,
    displayName: process.env.DISPLAY_NAME ?? 'Tester',
    role: process.env.ROLE ?? 'EDITOR',
  },
});

socket.on('connect', () => {
  console.log('[connect]', socket.id);
  console.log('[emit] JOIN_DRAFT', draftId);
  socket.emit('JOIN_DRAFT', { draftId });
});

socket.onAny((event, ...args) => {
  // 모든 이벤트를 찍어보고, 세션 초기화(PRESENCE_SNAPSHOT) 이후 락을 요청한다.
  console.log('[event]', event, JSON.stringify(args, null, 2));
  // PRESENCE_SNAPSHOT 이벤트 수신 시 락 요청
  // 한 번 PRESENCE_SNAPSHOT 요청이 완료되면 다시 요청하지 않음
  if (event === 'PRESENCE_SNAPSHOT' && lockKey && !sessionReady) {
    sessionReady = true;
    console.log('[emit] LOCK_ACQUIRE', lockKey);
    socket.emit('LOCK_ACQUIRE', { lockKey });
    heartbeatTimer = setInterval(() => {
      socket.emit('LOCK_HEARTBEAT', { lockKey });
    }, heartbeatIntervalMs);
  }
});

socket.on('connect_error', (err) => {
  // 연결 실패(인증/네트워크 문제 등)
  console.log('[connect_error]', err?.message ?? err);
});

socket.on('reconnect_attempt', (attempt) => {
  // 재연결 시도
  console.log('[reconnect_attempt]', attempt);
});

socket.on('connect_timeout', () => {
  // 연결 타임아웃
  console.log('[connect_timeout]');
});

setTimeout(() => {
  if (!socket.connected) {
    console.log('[timeout] connection not established after 5s');
  }
}, 5000);

socket.on('error', (payload) => {
  // 서버에서 내려주는 WS 에러
  console.log('[WS_ERROR]', JSON.stringify(payload, null, 2));
});

socket.on('disconnect', (reason) => {
  // 연결 종료(정상 종료/네트워크 끊김 등)
  console.log('[disconnect]', reason);
  if (heartbeatTimer) {
    clearInterval(heartbeatTimer);
    heartbeatTimer = undefined;
  }
});

process.on('SIGINT', () => {
  if (lockKey) {
    console.log('[emit] LOCK_RELEASE', lockKey);
    socket.emit('LOCK_RELEASE', { lockKey });
  }
  process.exit(0);
});
