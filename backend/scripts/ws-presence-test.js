// Usage:
// ACCESS_TOKEN=... node backend/scripts/ws-presence-test.js <draftId>
// ACCESS_TOKEN=... WS_URL=http://localhost:4000 node backend/scripts/ws-presence-test.js <draftId>
// ACCESS_TOKEN=... LOCK_KEY=block:<blockId> node backend/scripts/ws-presence-test.js <draftId>
// ACCESS_TOKEN=... LOCK_KEY=block:title node backend/scripts/ws-presence-test.js <draftId>
// ACCESS_TOKEN=... LOCK_KEY=table:<blockId> node backend/scripts/ws-presence-test.js <draftId>
// ACCESS_TOKEN=... LOCK_HEARTBEAT_MS=10000 node backend/scripts/ws-presence-test.js <draftId>
// ACCESS_TOKEN=... LOCK_KEY=block:<blockId> RELEASE_AFTER_MS=3000 node backend/scripts/ws-presence-test.js <draftId>
// ACCESS_TOKEN=... PATCH_JSON='{"type":"BLOCK_SET_TITLE","title":"테스트"}' node backend/scripts/ws-presence-test.js <draftId>
// ACCESS_TOKEN=... PATCH_JSON='{"type":"BLOCK_INSERT","block":{"id":"<uuid>","type":"TEXT","value":{"text":"hello"},"layout":{"row":1,"col":1,"span":2}}}' node backend/scripts/ws-presence-test.js <draftId>
// ACCESS_TOKEN=... PATCH_JSON='[{"type":"BLOCK_INSERT","block":{"id":"<uuid>","type":"DATE","value":{"date":"2025-01-14"},"layout":{"row":1,"col":1,"span":1}}},{"type":"BLOCK_INSERT","block":{"id":"<uuid>","type":"TIME","value":{"time":"13:30"},"layout":{"row":1,"col":2,"span":1}}}]' node backend/scripts/ws-presence-test.js <draftId>
// ACCESS_TOKEN=... PATCH_JSON='{"type":"BLOCK_SET_VALUE","blockId":"<blockId>","value":{"text":"updated"}}' node backend/scripts/ws-presence-test.js <draftId>
// ACCESS_TOKEN=... PATCH_JSON='{"type":"BLOCK_MOVE","moves":[{"blockId":"<blockId>","layout":{"row":2,"col":1,"span":2}}]}' node backend/scripts/ws-presence-test.js <draftId>
// ACCESS_TOKEN=... PATCH_JSON='{"type":"BLOCK_MOVE","moves":[{"blockId":"<blockId1>","layout":{"row":2,"col":1,"span":2}},{"blockId":"<blockId2>","layout":{"row":1,"col":2,"span":1}}]}' node backend/scripts/ws-presence-test.js <draftId>
// ACCESS_TOKEN=... STREAM_BLOCK_ID=<blockId> STREAM_VALUE='{"text":"typing..."}' node backend/scripts/ws-presence-test.js <draftId>
// ACCESS_TOKEN=... STREAM_BLOCK_ID=<blockId> STREAM_VALUE='{"text":"typing..."}' STREAM_INTERVAL_MS=2500 node backend/scripts/ws-presence-test.js <draftId>
// ACCESS_TOKEN=... LEAVE_AFTER_MS=2000 node backend/scripts/ws-presence-test.js <draftId>
// Block DTO 참고:
// - 타입/값 구조: backend/src/modules/post/dto/post-block.dto.ts
// - value 스키마: backend/src/modules/post/types/post-block.types.ts
const { io } = require('socket.io-client');

const draftId = process.argv[2] ?? '99057f70-74cd-4481-9ede-57b1b42c3945'; // 직접 입력하면 편함
const serverUrl = process.env.WS_URL ?? 'http://localhost:4000';
const accessToken = process.env.ACCESS_TOKEN;
const lockKey = process.env.LOCK_KEY;
const heartbeatIntervalMs = Number(process.env.LOCK_HEARTBEAT_MS ?? 10000);
const releaseAfterMs = Number(process.env.RELEASE_AFTER_MS ?? 0);
const patchBaseVersion = Number(process.env.PATCH_BASE_VERSION ?? 0);
const patchJson = process.env.PATCH_JSON;
const streamBlockId = process.env.STREAM_BLOCK_ID;
const streamValueRaw = process.env.STREAM_VALUE;
const streamIntervalMs = Number(process.env.STREAM_INTERVAL_MS ?? 2500);
const leaveAfterMs = Number(process.env.LEAVE_AFTER_MS ?? 0);
let heartbeatTimer;
let sessionReady = false;
let streamTimer;

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

const parseJson = (label, raw) => {
  if (!raw) return undefined;
  try {
    return JSON.parse(raw);
  } catch (error) {
    console.error(`[error] ${label} must be valid JSON.`);
    process.exit(1);
  }
};

const patchPayload = patchJson
  ? {
      draftId,
      baseVersion: patchBaseVersion,
      patch: parseJson('PATCH_JSON', patchJson),
    }
  : null;
const streamValue = streamValueRaw
  ? parseJson('STREAM_VALUE', streamValueRaw)
  : null;

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
    // 지정된 시간 후 락 해제 테스트용
    if (releaseAfterMs > 0) {
      setTimeout(() => {
        console.log('[emit] LOCK_RELEASE', lockKey);
        socket.emit('LOCK_RELEASE', { lockKey });
      }, releaseAfterMs);
    }
  }

  if (event === 'PRESENCE_SNAPSHOT' && !sessionReady) {
    sessionReady = true;
    if (patchPayload) {
      console.log('[emit] PATCH_APPLY', JSON.stringify(patchPayload, null, 2));
      socket.emit('PATCH_APPLY', patchPayload);
    }
    if (streamBlockId && streamValue !== null) {
      streamTimer = setInterval(() => {
        socket.emit('BLOCK_VALUE_STREAM', {
          blockId: streamBlockId,
          partialValue: streamValue,
        });
      }, streamIntervalMs);
    }
    if (leaveAfterMs > 0) {
      setTimeout(() => {
        console.log('[emit] LEAVE_DRAFT', draftId);
        socket.emit('LEAVE_DRAFT', { draftId });
      }, leaveAfterMs);
    }
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
  if (streamTimer) {
    clearInterval(streamTimer);
    streamTimer = undefined;
  }
});

process.on('SIGINT', () => {
  if (lockKey) {
    console.log('[emit] LOCK_RELEASE', lockKey);
    socket.emit('LOCK_RELEASE', { lockKey });
  }
  process.exit(0);
});
