import { GroupCover, LatestPost } from './group';
import { Block, MapPostItem, RecordScope, TagValue } from './record';
import { LocationValue, RatingValue, RecordBlock } from './recordField';

/**
 * 레코드 참여자 정보
 */
export interface Contributor {
  userId: string;
  role: 'AUTHOR' | 'CONTRIBUTOR';
  nickname: string;
  groupNickname: string;
  groupProfileImageId: null | string;
  profileImageId: string | null;
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
  contributors: Contributor[];
  groupId: string | null;
  title: string;
  eventAt: string;
  createdAt: string;
  updatedAt: string;
  location: LocationValue | null;
  tags: TagValue['tags'] | null;
  emotion: string[];
  rating: RatingValue['rating'] | null;
  blocks: Block[];
}

export interface newGroupResponse {
  id: string;
  name: string;
  owner: {
    id: string;
  };
  coverMediaId: null | string;
  coverSourcePostId: null | string;
  lastActivityAt: null | string;
  createdAt: string;
}

export interface GroupSummary {
  groupId: string;
  name: string;
  cover: GroupCover | null;
  memberCount: number;
  recordCount: number;
  createdAt: string;
  lastActivityAt: string;
  latestPost: LatestPost | null;
}

export interface Unread {
  hasUnread: boolean;
  unreadCount: number;
  lastReadAt: string;
}

export interface GroupListResponse {
  items: GroupSummary[];
  unread?: Unread | null;
}

export interface CoverSection {
  date: string;
  items: {
    mediaId: string;
    assetId: string;
    postId: string;
    postTitle: string;
    eventAt: string;
    width: number;
    height: number;
    mimeType: string;
  }[];
}

export interface GroupCoverListResponse {
  groupId: string;
  sections: CoverSection[];
  pageInfo: {
    hasNext: boolean;
    nextCursor: string | null;
  };
}

export interface GroupCoverUpdateResponse {
  groupId: string;
  cover: {
    assetId: string;
    sourcePostId: string;
  };
  updatedAt: string;
}

export type GroupDailyRecordedDatesResponse = string[];

export interface MonthlyRecordList {
  month: string;
  count: number;
  coverAssetId: string | null;
  latestTitle: string;
  latestLocation: string | null;
}

export interface DailyRecordList {
  date: string;
  postCount: number;
  coverAssetId: string | null;
  latestPostTitle: string;
  latestPlaceName: string | null;
}

export interface MyCoverListResponse {
  sections: CoverSection[];
  pageInfo: {
    hasNext: boolean;
    nextCursor: string | null;
  };
}

export interface MontlyCoverUpdateResponse {
  coverAssetId: string;
}
export type MyDailyRecordedDatesResponse = string[];

export interface MapListResponse {
  items: MapPostItem[];
  hasNextPage: boolean;
  nextCursor: string | null;
}
