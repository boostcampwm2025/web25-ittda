// Usage:
// ACCESS_TOKEN=... node backend/scripts/ws-flow-test.js <draftId> <groupId>
const { io } = require('socket.io-client');
const { randomUUID } = require('crypto');

const draftId = process.argv[2] ?? ''; // 직접 입력하면 편함
const groupId = process.argv[3] ?? ''; // 직접 입력하면 편함
const serverUrl = process.env.WS_URL ?? 'http://localhost:4000';
const apiBase = process.env.API_URL ?? 'http://localhost:4000/v1';
const accessToken = process.env.ACCESS_TOKEN ?? ''; // 직접 입력하면 편함

if (!draftId || !groupId) {
  console.error(
    'Usage: ACCESS_TOKEN=... node ws-flow-test.js <draftId> <groupId>',
  );
  process.exit(1);
}

if (!accessToken) {
  console.error('ACCESS_TOKEN is required.');
  process.exit(1);
}

const socket = io(serverUrl, {
  auth: { token: accessToken },
});

let sessionId;
let currentVersion = 0;
let title = '초안 제목';
const blocks = [];
const lockOwners = new Map();

const waitForEvent = (event, predicate, timeoutMs = 12000) =>
  new Promise((resolve, reject) => {
    const timeoutId = setTimeout(() => {
      socket.off(event, handler);
      reject(new Error(`${event} timeout`));
    }, timeoutMs);
    const handler = (payload) => {
      if (!predicate || predicate(payload)) {
        clearTimeout(timeoutId);
        socket.off(event, handler);
        resolve(payload);
      }
    };
    socket.on(event, handler);
  });

const waitForLock = async (lockKey) => {
  console.log('[wait] LOCK', lockKey);
  const knownOwner = lockOwners.get(lockKey);
  if (knownOwner === sessionId) {
    return { lockKey, ownerSessionId: sessionId };
  }
  const granted = waitForEvent(
    'LOCK_GRANTED',
    (payload) => payload?.lockKey === lockKey,
  );
  const changed = waitForEvent(
    'LOCK_CHANGED',
    (payload) =>
      payload?.lockKey === lockKey && payload?.ownerSessionId === sessionId,
  );
  const denied = waitForEvent(
    'LOCK_DENIED',
    (payload) => payload?.lockKey === lockKey,
  );
  const result = await Promise.race([granted, changed, denied]);
  if (result?.ownerSessionId && result.ownerSessionId !== sessionId) {
    console.log('[lock_denied]', lockKey, result.ownerSessionId);
  }
  return result;
};

const emitPatch = async (patch) => {
  console.log('[emit] PATCH_APPLY', JSON.stringify(patch, null, 2));
  const waitCommit = waitForEvent(
    'PATCH_COMMITTED',
    (payload) => payload?.authorSessionId === sessionId,
  );
  const waitStale = waitForEvent('PATCH_REJECTED_STALE');
  socket.emit('PATCH_APPLY', {
    draftId,
    baseVersion: currentVersion,
    patch,
  });
  const committed = await Promise.race([waitCommit, waitStale]);
  if (committed?.currentVersion !== undefined) {
    throw new Error(
      `PATCH_REJECTED_STALE currentVersion=${committed.currentVersion}`,
    );
  }
  console.log('[event] PATCH_COMMITTED', JSON.stringify(committed, null, 2));
  currentVersion = committed.version;
  return committed;
};

const emitStream = (blockId, partialValue) => {
  socket.emit('BLOCK_VALUE_STREAM', { blockId, partialValue });
};

const buildBlocks = () => {
  const dateId = randomUUID();
  const timeId = randomUUID();
  const textId = randomUUID();
  return {
    date: {
      id: dateId,
      type: 'DATE',
      value: { date: '2025-01-14' },
      layout: { row: 1, col: 1, span: 1 },
    },
    time: {
      id: timeId,
      type: 'TIME',
      value: { time: '13:30' },
      layout: { row: 1, col: 2, span: 1 },
    },
    text: {
      id: textId,
      type: 'TEXT',
      value: { text: '초안 텍스트' },
      layout: { row: 2, col: 1, span: 2 },
    },
  };
};

const run = async () => {
  await waitForEvent('PRESENCE_SNAPSHOT', (payload) => {
    sessionId = payload?.sessionId;
    if (typeof payload?.version === 'number') {
      currentVersion = payload.version;
    }
    if (Array.isArray(payload?.locks)) {
      payload.locks.forEach((lock) => {
        lockOwners.set(lock.lockKey, lock.ownerSessionId ?? null);
      });
    }
    return Boolean(sessionId);
  });
  console.log('[ready]', { sessionId });

  const { date, time, text } = buildBlocks();
  await emitPatch([
    { type: 'BLOCK_INSERT', block: date },
    { type: 'BLOCK_INSERT', block: time },
    { type: 'BLOCK_INSERT', block: text },
  ]);
  blocks.push(date, time, text);

  await waitForLock(`block:${text.id}`);
  emitStream(text.id, { text: '타이핑 중...' });
  emitStream(text.id, { text: '타이핑 중... 더' });

  await emitPatch({
    type: 'BLOCK_SET_VALUE',
    blockId: text.id,
    value: { text: '최종 텍스트' },
  });
  text.value = { text: '최종 텍스트' };

  const waitTitleLock = waitForLock('block:title');
  socket.emit('LOCK_ACQUIRE', { lockKey: 'block:title' });
  await waitTitleLock;
  title = '최종 제목';
  await emitPatch({ type: 'BLOCK_SET_TITLE', title });
  socket.emit('LOCK_RELEASE', { lockKey: 'block:title' });

  await emitPatch({
    type: 'BLOCK_MOVE',
    blockId: text.id,
    layout: { row: 3, col: 1, span: 2 },
  });
  text.layout = { row: 3, col: 1, span: 2 };

  await emitPatch({
    type: 'BLOCK_SET_VALUE',
    blockId: date.id,
    value: { date: '2025-01-15' },
  });
  date.value = { date: '2025-01-15' };

  await emitPatch({
    type: 'BLOCK_SET_VALUE',
    blockId: time.id,
    value: { time: '14:00' },
  });
  time.value = { time: '14:00' };

  const publishBody = {
    draftId,
    draftVersion: currentVersion,
    post: {
      scope: 'GROUP',
      groupId,
      title,
      blocks,
    },
  };

  const res = await fetch(`${apiBase}/groups/${groupId}/posts/publish`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify(publishBody),
  });

  const body = await res.json();
  console.log('[publish]', res.status, JSON.stringify(body, null, 2));
  socket.disconnect();
};

socket.on('connect', () => {
  console.log('[connect]', socket.id);
  socket.emit('JOIN_DRAFT', { draftId });
});

socket.onAny((event, ...args) => {
  console.log('[event]', event, JSON.stringify(args, null, 2));
  if (event === 'LOCK_CHANGED') {
    const payload = args[0];
    if (payload?.lockKey) {
      lockOwners.set(payload.lockKey, payload.ownerSessionId ?? null);
    }
  }
  if (event === 'LOCK_GRANTED') {
    const payload = args[0];
    if (payload?.lockKey) {
      lockOwners.set(payload.lockKey, payload.ownerSessionId ?? null);
    }
  }
});

socket.on('connect_error', (err) => {
  console.log('[connect_error]', err?.message ?? err);
});

run().catch((error) => {
  console.error('[error]', error.message);
  socket.disconnect();
  process.exit(1);
});
