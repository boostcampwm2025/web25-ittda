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

export type StreamPayload = {
  blockId: string;
  partialValue: unknown;
};

export type PatchCommand =
  | {
      type: 'BLOCK_INSERT';
      block: import('../dto/post-block.dto').PostBlockDto;
    }
  | { type: 'BLOCK_DELETE'; blockId: string }
  | {
      type: 'BLOCK_MOVE';
      blockId: string;
      layout: import('../dto/block-layout.dto').BlockLayoutDto;
    }
  | { type: 'BLOCK_SET_VALUE'; blockId: string; value: unknown }
  | { type: 'BLOCK_SET_TITLE'; title: string };

export type PatchApplyPayload = {
  draftId: string;
  baseVersion: number;
  patch: PatchCommand | PatchCommand[];
};

export type DraftSocketData = {
  user?: import('@/modules/auth/auth.type').MyJwtPayload;
  sessionId?: string;
  actorId?: string;
  displayName?: string;
  role?: string;
  draftId?: string;
};
