import { http, HttpResponse } from 'msw';
import { makeFakePosts, filterByBbox } from '../fake/fakePosts';
import { RecordPreview } from '../types/recordResponse';

const DB = makeFakePosts(2000);

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

// GET /api/posts?bbox=minLat,minLng,maxLat,maxLng&limit=50
export const handlers = [
  http.get('/api/feed', ({ request }) => {
    const url = new URL(request.url);
    const date = url.searchParams.get('date');

    // 요청된 날짜로 mock 데이터 생성 (날짜가 없으면 오늘 날짜 사용)
    const today = new Date().toISOString().split('T')[0];
    const targetDate = date || today;
    const mockRecords = createMockRecordPreviews(targetDate);

    return HttpResponse.json(
      {
        success: true,
        data: mockRecords,
        error: null,
      },
      { status: 200 },
    );
  }),

  http.post('/api/auth/guest', () => {
    return HttpResponse.json(
      {
        success: true,
        data: {
          guest: true,
          guestSessionId: 'gs_abc123',
          expiresAt: '2026-01-14T12:00:00Z',
        },
        error: null,
      },
      {
        status: 200,
      },
    );
  }),
  http.get('/api/posts/list', ({ request }) => {
    const url = new URL(request.url);
    const page = Number(url.searchParams.get('page') ?? '1');
    const limit = Number(url.searchParams.get('limit') ?? '10');

    const totalCount = DB.length;
    const totalPages = Math.ceil(totalCount / limit);

    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;

    const items = DB.slice(startIndex, endIndex).map(
      ({ lat, lng, ...rest }) => rest,
    );

    return HttpResponse.json(
      {
        meta: {
          totalCount,
          currentPage: page,
          totalPages,
        },
        items, // RecordListItem 형태
      },
      { status: 200 },
    );
  }),

  http.get('/api/posts', ({ request }) => {
    const url = new URL(request.url);
    const bboxStr = url.searchParams.get('bbox');
    const limit = Number(url.searchParams.get('limit') ?? '50');

    if (!bboxStr) {
      return HttpResponse.json(
        { meta: { count: 0 }, items: [] },
        { status: 200 },
      );
    }

    const [minLat, minLng, maxLat, maxLng] = bboxStr.split(',').map(Number);

    const items = filterByBbox(DB, { minLat, minLng, maxLat, maxLng })
      .sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1))
      .slice(0, limit);

    return HttpResponse.json(
      {
        meta: { bbox: { minLat, minLng, maxLat, maxLng }, count: items.length },
        items,
      },
      { status: 200 },
    );
  }),

  http.get('/api/posts/:id', ({ params }) => {
    const id = String(params.id);

    const today = new Date().toISOString().split('T')[0];
    const mockRecords = createMockRecordPreviews(today);

    const found = mockRecords.find((p) => p.postId === id);

    if (!found) return new HttpResponse(null, { status: 404 });

    // RecordDetail 형식으로 변환
    const recordDetail = {
      id: found.postId,
      scope: found.scope,
      ownerUserId: 'user-001',
      groupId: found.groupId,
      title: found.title,
      createdAt: found.createdAt,
      updatedAt: found.updatedAt,
      blocks: found.blocks,
      contributors: [
        {
          userId: 'user-001',
          role: 'AUTHOR' as const,
          nickname: '도비',
        },
      ],
    };

    return HttpResponse.json(
      {
        success: true,
        data: recordDetail,
        error: null,
      },
      { status: 200 },
    );
  }),
];
