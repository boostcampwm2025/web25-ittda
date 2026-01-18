import { Block, RecordScope, TagValue } from './record';
import { LocationValue, RatingValue, RecordBlock } from './recordField';

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

export interface RecordPreview {
  postId: string;
  scope: 'ME' | 'GROUP';
  groupId: string | null;
  title: string;
  eventAt: string;
  createdAt: string;
  updatedAt: string;
  location: LocationValue | null;
  tags: TagValue['tags'] | null;
  rating: RatingValue['rating'] | null;
  block: Block[];
}
