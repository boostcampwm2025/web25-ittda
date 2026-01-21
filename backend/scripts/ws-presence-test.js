const { io } = require('socket.io-client');

const draftId = process.argv[2] ?? 'draft-1';
const serverUrl = process.env.WS_URL ?? 'http://localhost:4000';
const accessToken = process.env.ACCESS_TOKEN;

if (!accessToken) {
  console.error('ACCESS_TOKEN is required.');
  process.exit(1);
}

const socket = io(serverUrl, {
  auth: {
    token: accessToken,
    displayName: process.env.DISPLAY_NAME ?? 'Tester',
    role: process.env.ROLE ?? 'EDITOR',
  },
});

socket.on('connect', () => {
  console.log('[connect]', socket.id);
  socket.emit('JOIN_DRAFT', { draftId });
});

socket.on('connect_error', (err) => {
  console.log('[connect_error]', err?.message ?? err);
});

socket.on('reconnect_attempt', (attempt) => {
  console.log('[reconnect_attempt]', attempt);
});

socket.on('PRESENCE_SNAPSHOT', (payload) => {
  console.log('[PRESENCE_SNAPSHOT]', JSON.stringify(payload, null, 2));
});

socket.on('PRESENCE_JOINED', (payload) => {
  console.log('[PRESENCE_JOINED]', JSON.stringify(payload, null, 2));
});

socket.on('PRESENCE_LEFT', (payload) => {
  console.log('[PRESENCE_LEFT]', JSON.stringify(payload, null, 2));
});

socket.on('error', (payload) => {
  console.log('[WS_ERROR]', JSON.stringify(payload, null, 2));
});

socket.on('disconnect', (reason) => {
  console.log('[disconnect]', reason);
});
