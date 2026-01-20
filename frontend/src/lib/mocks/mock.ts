import {
  GroupCoverListResponse,
  GroupListResponse,
  RecordPreview,
} from '../types/recordResponse';

// 요청된 날짜에 맞는 mock 데이터를 생성하는 함수
export const createMockRecordPreviews = (date: string): RecordPreview[] => [
  // 기록 1: 이미지 먼저, 태그/평점 2열, 텍스트, 날짜/시간 2열
  {
    postId: '225f4bd7-3bbc-4a71-8747-fe6a43dc3d6c',
    scope: 'ME',
    groupId: null,
    title: '성수동 팝업스토어 방문',
    eventAt: `${date}T13:30:00Z`,
    createdAt: `${date}T14:00:00Z`,
    updatedAt: `${date}T14:00:00Z`,
    location: {
      lat: 37.5445,
      lng: 127.0567,
      address: '서울 성동구 성수동2가',
      placeName: '성수동 팝업스토어',
    },
    tags: ['popup', 'seongsu', 'weekend'],
    rating: 4,
    blocks: [
      {
        id: 'image-block-1',
        type: 'IMAGE',
        value: {
          tempUrls: [
            'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&q=80&w=800',
          ],
        },
        layout: { row: 1, col: 1, span: 2 },
      },
      {
        id: 'tag-block-1',
        type: 'TAG',
        value: { tags: ['popup', 'seongsu', 'weekend'] },
        layout: { row: 2, col: 1, span: 1 },
      },
      {
        id: 'rating-block-1',
        type: 'RATING',
        value: { rating: 4 },
        layout: { row: 2, col: 2, span: 1 },
      },
      {
        id: 'text-block-1',
        type: 'TEXT',
        value: {
          text: '오늘 성수동 팝업스토어 다녀왔다! 한정판 굿즈도 득템 성공',
        },
        layout: { row: 3, col: 1, span: 2 },
      },
      {
        id: 'date-block-1',
        type: 'DATE',
        value: { date },
        layout: { row: 4, col: 1, span: 1 },
      },
      {
        id: 'time-block-1',
        type: 'TIME',
        value: { time: '13:30' },
        layout: { row: 4, col: 2, span: 1 },
      },
    ],
  },
  // 기록 2: 평점만 전체 너비, 위치, 이미지 2장
  {
    postId: 'b3c7e8f1-2a45-4d89-9c12-abc123def456',
    scope: 'ME',
    groupId: null,
    title: '한남동 브런치 맛집',
    eventAt: `${date}T11:00:00Z`,
    createdAt: `${date}T12:30:00Z`,
    updatedAt: `${date}T12:30:00Z`,
    location: {
      lat: 37.5347,
      lng: 127.0008,
      address: '서울 용산구 한남동',
      placeName: '카페 라떼',
    },
    tags: ['brunch', 'hannam', 'cafe'],
    rating: 5,
    blocks: [
      {
        id: 'rating-block-2',
        type: 'RATING',
        value: { rating: 5 },
        layout: { row: 1, col: 1, span: 2 },
      },
      {
        id: 'loc-block-2',
        type: 'LOCATION',
        value: {
          lat: 37.5347,
          lng: 127.0008,
          address: '서울 용산구 한남동',
          placeName: '카페 라떼',
        },
        layout: { row: 2, col: 1, span: 2 },
      },
      {
        id: 'image-block-2',
        type: 'IMAGE',
        value: {
          tempUrls: [
            'https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&q=80&w=800',
            'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?auto=format&fit=crop&q=80&w=800',
          ],
        },
        layout: { row: 3, col: 1, span: 2 },
      },
      {
        id: 'text-block-2',
        type: 'TEXT',
        value: {
          text: '한남동 새로 생긴 브런치 카페! 에그 베네딕트가 정말 맛있었다',
        },
        layout: { row: 4, col: 1, span: 2 },
      },
    ],
  },
  // 기록 3: 텍스트 먼저, 날짜/위치 2열, 태그 전체 너비
  {
    postId: 'c9d8e7f6-5b34-4c21-8a09-fed987cba654',
    scope: 'GROUP',
    groupId: 'group-123',
    title: '홍대 버스킹 구경',
    eventAt: `${date}T19:00:00Z`,
    createdAt: `${date}T21:00:00Z`,
    updatedAt: `${date}T21:00:00Z`,
    location: {
      lat: 37.5563,
      lng: 126.9236,
      address: '서울 마포구 서교동',
      placeName: '홍대 걷고싶은거리',
    },
    tags: ['busking', 'hongdae', 'music', 'nightlife'],
    rating: 4,
    blocks: [
      {
        id: 'text-block-3',
        type: 'TEXT',
        value: {
          text: '홍대에서 버스킹 구경했는데 실력이 대박이었음! 다음에 또 와야지',
        },
        layout: { row: 1, col: 1, span: 2 },
      },
      {
        id: 'date-block-3',
        type: 'DATE',
        value: { date },
        layout: { row: 2, col: 1, span: 1 },
      },
      {
        id: 'loc-block-3',
        type: 'LOCATION',
        value: {
          lat: 37.5563,
          lng: 126.9236,
          address: '서울 마포구 서교동',
          placeName: '홍대 걷고싶은거리',
        },
        layout: { row: 2, col: 2, span: 1 },
      },
      {
        id: 'tag-block-3',
        type: 'TAG',
        value: { tags: ['busking', 'hongdae', 'music', 'nightlife'] },
        layout: { row: 3, col: 1, span: 2 },
      },
      {
        id: 'rating-block-3',
        type: 'RATING',
        value: { rating: 4 },
        layout: { row: 4, col: 1, span: 1 },
      },
      {
        id: 'time-block-3',
        type: 'TIME',
        value: { time: '19:00' },
        layout: { row: 4, col: 2, span: 1 },
      },
    ],
  },
];

export const createMockGroupList = (): GroupListResponse => ({
  items: [
    {
      groupId: 'group-1',
      name: '우리들의 행복한 기록함',
      cover: {
        assetId: '/profile-ex.jpeg',
        width: 1080,
        height: 1350,
        mimeType: 'image/jpeg',
      },
      memberCount: 7,
      recordCount: 124,
      createdAt: new Date().toISOString(),
      lastActivityAt: new Date().toISOString(),
      latestPost: {
        postId: 'post-101',
        title: '성수동 카페 투어',
        eventAt: new Date().toISOString(),
        placeName: '성수동',
      },
    },
    {
      groupId: 'group-2',
      name: '제주도 여행 한 달 살기',
      cover: {
        assetId: '/base.png',
        width: 1080,
        height: 1350,
        mimeType: 'image/jpeg',
      },
      memberCount: 11,
      recordCount: 45,
      createdAt: new Date().toISOString(),
      lastActivityAt: new Date().toISOString(),
      latestPost: {
        postId: 'post-202',
        title: '협재 해변 산책로에서',
        eventAt: new Date().toISOString(),
        placeName: '협재 해수욕장',
      },
    },
    {
      groupId: 'group-3',
      name: '아주 길어서 말줄임표가 생길 것 같은 테스트용 그룹 이름입니다',
      cover: {
        assetId: '/profile-ex.jpeg',
        width: 1080,
        height: 1350,
        mimeType: 'image/jpeg',
      },
      memberCount: 9,
      recordCount: 312,
      createdAt: new Date().toISOString(),
      lastActivityAt: new Date().toISOString(),
      latestPost: {
        postId: 'post-303',
        title: '주말 대가족 모임 사진첩',
        eventAt: '2026-01-19T08:00:00Z',
        placeName: '강남역 모임장소',
      },
    },
  ],
});

// 전체 mock 데이터 (페이지네이션 테스트용)
const allCoverSections = [
  {
    date: '2026-01-14',
    items: [
      {
        mediaId: 'media-1',
        assetId: '/profile-ex.jpeg',
        postId: 'uuid1',
        postTitle: '부산 여행 1일차',
        eventAt: '2026-01-14T18:30:00Z',
        width: 1080,
        height: 1350,
        mimeType: 'image/jpeg',
      },
      {
        mediaId: 'media-2',
        assetId: '/base.png',
        postId: 'uuid2',
        postTitle: '부산 여행 2일차',
        eventAt: '2026-01-14T10:00:00Z',
        width: 1280,
        height: 720,
        mimeType: 'image/png',
      },
    ],
  },
  {
    date: '2026-01-10',
    items: [
      {
        mediaId: 'media-3',
        assetId: '/profile-ex.jpeg',
        postId: 'uuid3',
        postTitle: '서울 카페 투어',
        eventAt: '2026-01-10T09:00:00Z',
        width: 1280,
        height: 720,
        mimeType: 'image/png',
      },
    ],
  },
  {
    date: '2026-01-08',
    items: [
      {
        mediaId: 'media-4',
        assetId: '/base.png',
        postId: 'uuid4',
        postTitle: '한강 피크닉',
        eventAt: '2026-01-08T14:00:00Z',
        width: 1080,
        height: 1350,
        mimeType: 'image/jpeg',
      },
      {
        mediaId: 'media-5',
        assetId: '/profile-ex.jpeg',
        postId: 'uuid5',
        postTitle: '한강 야경',
        eventAt: '2026-01-08T20:00:00Z',
        width: 1920,
        height: 1080,
        mimeType: 'image/jpeg',
      },
    ],
  },
  {
    date: '2026-01-05',
    items: [
      {
        mediaId: 'media-6',
        assetId: '/base.png',
        postId: 'uuid6',
        postTitle: '북촌 한옥마을',
        eventAt: '2026-01-05T11:00:00Z',
        width: 1080,
        height: 1350,
        mimeType: 'image/jpeg',
      },
    ],
  },
];

const PAGE_SIZE = 2; // 페이지당 section 수

export const createMockGroupCoverList = (
  groupId: string,
  cursor: string | null,
): GroupCoverListResponse => {
  // cursor는 시작 인덱스를 나타냄
  const startIndex = cursor ? parseInt(cursor, 10) : 0;
  const endIndex = startIndex + PAGE_SIZE;

  const sections = allCoverSections.slice(startIndex, endIndex);
  const hasNext = endIndex < allCoverSections.length;

  return {
    groupId,
    sections,
    pageInfo: {
      hasNext,
      nextCursor: hasNext ? String(endIndex) : null,
    },
  };
};
