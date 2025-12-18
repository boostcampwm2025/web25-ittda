import type { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import * as request from 'supertest';
import type { Server } from 'http';
import { AppModule } from '../src/app.module';

interface PostsListResponse {
  meta: { bbox: unknown; count: number };
  items: Array<{
    id: string;
    [key: string]: unknown;
  }>;
}

describe('PostController (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('GET /posts with bbox should return items', async () => {
    const bbox = '37.3,126.7,37.8,127.3';

    const res = await request(app.getHttpServer() as Server)
      .get('/posts')
      .query({ bbox, limit: 10 })
      .expect(200);
    const body = res.body as PostsListResponse;

    expect(body).toHaveProperty('meta');
    expect(body).toHaveProperty('items');
    expect(Array.isArray(body.items)).toBe(true);
  });

  it('GET /posts without bbox should return empty items', async () => {
    const res = await request(app.getHttpServer() as Server)
      .get('/posts')
      .expect(200);
    const body = res.body as PostsListResponse;

    expect(body).toEqual({
      meta: { bbox: null, count: 0 },
      items: [],
    });
  });

  it('GET /posts/:id should return a single post', async () => {
    const bbox = '37.3,126.7,37.8,127.3';

    const listRes = await request(app.getHttpServer() as Server)
      .get('/posts')
      .query({ bbox, limit: 1 })
      .expect(200);
    const listBody = listRes.body as PostsListResponse;

    const first = listBody.items[0];
    expect(first).toBeDefined();

    const res = await request(app.getHttpServer() as Server)
      .get(`/posts/${first.id}`)
      .expect(200);
    const body = res.body as { id: string };

    expect(body).toHaveProperty('id', first.id);
  });

  it('GET /posts/:id with non-existing id returns 404', async () => {
    await request(app.getHttpServer() as Server)
      .get('/posts/non-existent-id')
      .expect(404);
  });
});
