import type { Server, Socket } from 'socket.io';
import type { LockService } from './lock.service';

export const emitLockExpired = (
  server: Server,
  room: string,
  lockKey: string,
  ownerSessionId: string,
) => {
  server.to(room).emit('LOCK_EXPIRED', {
    lockKey,
    ownerSessionId,
  });
  server.to(room).emit('LOCK_CHANGED', {
    lockKey,
    ownerSessionId: null,
  });
};

export const emitLockGranted = (
  server: Server,
  room: string,
  socket: Socket,
  lockKey: string,
  ownerSessionId: string,
) => {
  socket.emit('LOCK_GRANTED', { lockKey, ownerSessionId });
  server.to(room).emit('LOCK_CHANGED', {
    lockKey,
    ownerSessionId,
  });
};

export const acquireLockWithEmit = async (
  lockService: LockService,
  server: Server,
  room: string,
  socket: Socket,
  draftId: string,
  lockKey: string,
  actorId: string,
  sessionId: string,
) => {
  const result = await lockService.acquireLock(
    draftId,
    lockKey,
    actorId,
    sessionId,
    (entry) =>
      emitLockExpired(server, room, entry.lockKey, entry.ownerSessionId),
  );
  if (result.ok) {
    emitLockGranted(server, room, socket, lockKey, sessionId);
  }
  return result;
};
