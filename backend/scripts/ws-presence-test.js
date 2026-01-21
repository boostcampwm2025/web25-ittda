const { io } = require('socket.io-client');

const draftId = process.argv[2] ?? 'draft-1';
const serverUrl = process.env.WS_URL ?? 'http://localhost:4000';
const accessToken = process.env.ACCESS_TOKEN;

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
  console.log('[event]', event, JSON.stringify(args, null, 2));
});

socket.on('connect_error', (err) => {
  console.log('[connect_error]', err?.message ?? err);
});

socket.on('reconnect_attempt', (attempt) => {
  console.log('[reconnect_attempt]', attempt);
});

socket.on('connect_timeout', () => {
  console.log('[connect_timeout]');
});

setTimeout(() => {
  if (!socket.connected) {
    console.log('[timeout] connection not established after 5s');
  }
}, 5000);

socket.on('error', (payload) => {
  console.log('[WS_ERROR]', JSON.stringify(payload, null, 2));
});

socket.on('disconnect', (reason) => {
  console.log('[disconnect]', reason);
});
