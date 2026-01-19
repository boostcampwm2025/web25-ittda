import { RecordScope } from './record';
import { RecordBlock } from './recordField';

/**
 * 레코드 참여자 정보
 */
export interface Contributor {
  userId: string;
  role: 'AUTHOR' | 'CONTRIBUTOR';
  nickname: string;
}

/**
 * 레코드 상세 정보
 */
export interface RecordDetail {
  id: string;
  scope: RecordScope;
  ownerUserId?: string;
  groupId?: string | null;
  title: string;
  createdAt: string;
  updatedAt: string;
  blocks: RecordBlock[];
  contributors: Contributor[];
}
