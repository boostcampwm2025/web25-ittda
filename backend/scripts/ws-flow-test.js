// Usage:
// ACCESS_TOKEN=... node backend/scripts/ws-flow-test.js <draftId> <groupId>
// ACCESS_TOKEN=... WS_URL=http://localhost:4000 API_URL=http://localhost:4000/v1 node backend/scripts/ws-flow-test.js <draftId> <groupId>
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
let blocks = [];
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

const acquireLock = async (lockKey) => {
  const knownOwner = lockOwners.get(lockKey);
  if (knownOwner === sessionId) {
    return { lockKey, ownerSessionId: sessionId };
  }
  socket.emit('LOCK_ACQUIRE', { lockKey });
  return waitForLock(lockKey);
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

const buildBlock = (type, value, layout) => ({
  id: randomUUID(),
  type,
  value,
  layout,
});

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

  const snapshotRes = await fetch(
    `${apiBase}/groups/${groupId}/drafts/${draftId}`,
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    },
  );
  if (!snapshotRes.ok) {
    throw new Error(`snapshot fetch failed: ${snapshotRes.status}`);
  }
  const snapshotBody = await snapshotRes.json();
  const snapshotPayload = snapshotBody.data ?? snapshotBody;
  if (typeof snapshotPayload.version === 'number') {
    currentVersion = snapshotPayload.version;
  }
  blocks = Array.isArray(snapshotPayload.snapshot?.blocks)
    ? snapshotPayload.snapshot.blocks
    : [];

  const missingBlocks = [];
  let date = blocks.find((block) => block.type === 'DATE');
  let time = blocks.find((block) => block.type === 'TIME');
  let text = blocks.find((block) => block.type === 'TEXT');

  if (!date) {
    date = buildBlock('DATE', { date: '2025-01-14' }, { row: 1, col: 1, span: 1 });
    missingBlocks.push(date);
  }
  if (!time) {
    time = buildBlock('TIME', { time: '13:30' }, { row: 1, col: 2, span: 1 });
    missingBlocks.push(time);
  }
  if (!text) {
    text = buildBlock('TEXT', { text: '초안 텍스트' }, { row: 2, col: 1, span: 2 });
    missingBlocks.push(text);
  }

  if (missingBlocks.length > 0) {
    await emitPatch(
      missingBlocks.map((block) => ({ type: 'BLOCK_INSERT', block })),
    );
    blocks = blocks.concat(missingBlocks);
  }

  await acquireLock(`block:${text.id}`);
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
  socket.emit('LOCK_RELEASE', { lockKey: `block:${text.id}` });

  await acquireLock(`block:${date.id}`);
  await emitPatch({
    type: 'BLOCK_SET_VALUE',
    blockId: date.id,
    value: { date: '2025-01-15' },
  });
  date.value = { date: '2025-01-15' };
  socket.emit('LOCK_RELEASE', { lockKey: `block:${date.id}` });

  await acquireLock(`block:${time.id}`);
  await emitPatch({
    type: 'BLOCK_SET_VALUE',
    blockId: time.id,
    value: { time: '14:00' },
  });
  time.value = { time: '14:00' };
  socket.emit('LOCK_RELEASE', { lockKey: `block:${time.id}` });

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
