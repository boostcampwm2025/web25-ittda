import { http, HttpResponse } from 'msw';
import { makeFakePosts, filterByBbox } from '../fake/fakePosts';
import {
  createMockDailyRecord,
  createMockEmotionStats,
  createMockGroupCoverList,
  createMockGroupList,
  createMockMonthlyRecord,
  createMockRecordPreviews,
  createMockTagStats,
} from './mock';

const DB = makeFakePosts(2000);

// GET /api/posts?bbox=minLat,minLng,maxLat,maxLng&limit=50
export const handlers = [
  http.delete('/api/posts/:postId', ({ params }) => {
    const id = String(params.postId);

    return HttpResponse.json({
      success: true,
      data: {},
      error: null,
    });
  }),
  http.get('/api/user/archives/days', ({ request }) => {
    const url = new URL(request.url);
    const month = url.searchParams.get('month');

    return HttpResponse.json({
      success: true,
      data: createMockDailyRecord(),
      error: null,
    });
  }),
  http.get('/api/user/archives/months', ({ request }) => {
    const url = new URL(request.url);
    const year = url.searchParams.get('year');

    return HttpResponse.json({
      success: true,
      data: createMockMonthlyRecord(),
      error: null,
    });
  }),
  http.get('/api/me/stats/summary', ({ request }) => {
    const url = new URL(request.url);
    const date = url.searchParams.get('date') || new Date().toISOString();

    const parts = date.split('-').map((s) => parseInt(s, 10));

    if (parts.length === 2) {
      return HttpResponse.json({
        success: true,
        data: {
          count: 2,
        },
        error: null,
      });
    } else {
      return HttpResponse.json({
        success: true,
        data: {
          count: 16,
        },
        error: null,
      });
    }
  }),
  http.get('/api/me/emotions/summary', ({ request }) => {
    const url = new URL(request.url);
    const limit = url.searchParams.get('limit');

    return HttpResponse.json({
      success: true,
      data: createMockEmotionStats(),
      error: null,
    });
  }),
  http.get('/api/me/tags/stats', ({ request }) => {
    const url = new URL(request.url);
    const limit = url.searchParams.get('limit');

    return HttpResponse.json({
      success: true,
      data: createMockTagStats(),
      error: null,
    });
  }),
  http.get('/api/me', () => {
    return HttpResponse.json({
      success: true,
      data: {
        userId: 'dobby_is_free',
        user: {
          id: 'dobby_is_free',
          profileImageId: '/profile-ex.jpeg',
          profileImage: {
            url: '/profile-ex.jpeg',
          },
          provider: 'google',
          providerId: 'google',
          email: 'user@example.com',
          nickname: '도비',
          settings: {},
          createdAt: '2024-01-01T00:00:00Z',
        },
        stats: {
          recentTags: ['맛집', '여행'],
          frequentTags: ['산책', '코딩'],
          recentEmotions: ['기쁨', '설렘'],
          frequentEmotions: ['평온'],
        },
      },
      error: null,
    });
  }),
  http.patch('/api/groups/:groupId/cover', async ({ request, params }) => {
    const id = String(params.groupId);
    const body = (await request.json()) as {
      assetId: string;
      sourcePostId: string;
    };

    return HttpResponse.json({
      success: true,
      data: {
        groupId: id,
        cover: {
          assetId: body.assetId,
          sourcePostId: body.sourcePostId,
        },
        updatedAt: new Date().toISOString(),
      },
      error: null,
    });
  }),
  http.post('/api/groups', async ({ request }) => {
    const body = (await request.json()) as { name: string };

    return HttpResponse.json({
      success: true,
      data: {
        groupId: `${body.name}-uuid`,
        name: body.name,
        cover: null,
        memberCount: 1,
        recordCount: 0,
        createdAt: new Date().toISOString(),
        lastActivityAt: new Date().toISOString(),
        latestPost: null,
      },
      error: null,
    });
  }),
  http.get('/api/groups/:groupId/cover-candidates', ({ params, request }) => {
    const id = String(params.groupId);
    const url = new URL(request.url);
    const cursor = url.searchParams.get('cursor');

    const mockImgs = createMockGroupCoverList(id, cursor);
    return HttpResponse.json({
      success: true,
      data: mockImgs,
      error: null,
    });
  }),
  http.get('/api/groups', () => {
    const mockGroups = createMockGroupList();
    return HttpResponse.json(
      {
        success: true,
        data: mockGroups,
        error: null,
      },
      { status: 200 },
    );
  }),
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
