export type PresenceMember = {
  sessionId: string;
  displayName: string;
  profileImageId: string | null;
  permissionRole: string;
  lastSeenAt: string;
};

export type LockEntry = {
  lockKey: string;
  ownerActorId: string;
  ownerSessionId: string;
  expiresAt: number;
  timeoutId: NodeJS.Timeout;
};

export type JoinDraftPayload = {
  draftId: string;
};

export type LockPayload = {
  lockKey: string;
};

export type DraftSocketData = {
  user?: import('@/modules/auth/auth.type').MyJwtPayload;
  sessionId?: string;
  actorId?: string;
  displayName?: string;
  role?: string;
  draftId?: string;
};
