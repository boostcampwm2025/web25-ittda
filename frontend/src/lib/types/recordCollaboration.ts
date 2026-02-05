import { BlockLayout, BlockValue, RecordBlock } from './record';

export type PatchApplyPayload =
  | {
      type: 'BLOCK_INSERT';
      block: RecordBlock;
    }
  | {
      type: 'BLOCK_DELETE';
      blockId: string;
    }
  | {
      type: 'BLOCK_MOVE';
      moves: Array<{
        blockId: string;
        layout: BlockLayout;
      }>;
    }
  | {
      type: 'BLOCK_SET_VALUE';
      blockId: string;
      value: BlockValue;
    }
  | {
      type: 'BLOCK_SET_TITLE';
      title: string;
    };

// 소켓 예외 상세 데이터
export interface SocketExceptionData {
  draftId?: string;
  blockId?: string;
  sessionId?: string;
  pattern?: string;
  partialValue?: {
    text?: string;
    [key: string]: unknown;
  };
}

// 서버에서 보내주는 예외 응답
export interface SocketExceptionResponse {
  status: 'error' | string;
  message: string;
  cause?: {
    pattern: string;
    [key: string]: unknown;
  };
  data?: SocketExceptionData;
}

export interface GroupDraftListItem {
  draftId: string;
  kind: 'CREATE' | 'EDIT';
  targetPostId: string | null;
  title: string;
  createdAt: string;
  updatedAt: string;
  participantCount: number;
  isPublishing: boolean;
}

export interface GroupDraftListSnapshot {
  groupId: string;
  drafts: GroupDraftListItem[];
}
