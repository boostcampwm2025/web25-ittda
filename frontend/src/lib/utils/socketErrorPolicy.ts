export const SOCKET_ERROR_ACTIONS = {
  REFRESH_AUTH: 'REFRESH_AUTH',
  SHOW_DRAFT_FULL: 'SHOW_DRAFT_FULL',
  IGNORE: 'IGNORE',
  REPORT: 'REPORT',
} as const;

export type SocketErrorAction =
  (typeof SOCKET_ERROR_ACTIONS)[keyof typeof SOCKET_ERROR_ACTIONS];

const AUTH_ERROR_CODES = new Set(['UNAUTHORIZED', 'INVALID_TOKEN']);
const IGNORED_ERROR_CODES = new Set([
  'WS_STALE_EVENT',
  'WS_FORBIDDEN',
  'WS_LOCK_DENIED',
  'WS_SESSION_INVALID',
  'WS_NOT_FOUND',
  'WS_VALIDATION_ERROR',
]);

export function getSocketErrorAction(code?: string): SocketErrorAction {
  if (!code) {
    return SOCKET_ERROR_ACTIONS.REPORT;
  }

  if (AUTH_ERROR_CODES.has(code)) {
    return SOCKET_ERROR_ACTIONS.REFRESH_AUTH;
  }

  if (code === 'WS_DRAFT_FULL') {
    return SOCKET_ERROR_ACTIONS.SHOW_DRAFT_FULL;
  }

  if (IGNORED_ERROR_CODES.has(code)) {
    return SOCKET_ERROR_ACTIONS.IGNORE;
  }

  return SOCKET_ERROR_ACTIONS.REPORT;
}
