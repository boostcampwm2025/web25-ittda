import { http, HttpResponse } from 'msw';
import { makeFakePosts, filterByBbox } from '../fake/fakePosts';

const DB = makeFakePosts(2000);

// GET /posts?bbox=minLat,minLng,maxLat,maxLng&limit=50
export const handlers = [
  http.get('/posts/list', ({ request }) => {
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

  http.get('/posts', ({ request }) => {
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

  http.get('/posts/:id', ({ params }) => {
    const id = String(params.id);
    const found = DB.find((p) => p.id === id);
    if (!found) return new HttpResponse(null, { status: 404 });
    return HttpResponse.json(found, { status: 200 });
  }),
];
