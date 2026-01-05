import type { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import type { Server } from 'http';
import type { TemplateType } from '../src/post/post.types';
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

  it('POST /posts should create a new post', async () => {
    const payload: {
      title: string;
      content: string;
      templateType: TemplateType;
    } = {
      title: '새 게시글 제목',
      content: '새 게시글 내용입니다.',
      templateType: 'diary',
    };

    const createRes = await request(app.getHttpServer() as Server)
      .post('/posts')
      .send(payload)
      .expect(201);

    const created = createRes.body as {
      id: string;
      title: string;
      content: string;
      templateType: TemplateType;
      createdAt: string;
    };

    expect(created.id).toBeDefined();
    expect(created.title).toBe(payload.title);
    expect(created.content).toBe(payload.content);
    expect(created.templateType).toBe(payload.templateType);
    expect(typeof created.createdAt).toBe('string');

    // 실제로 조회가 되는지 한 번 더 확인
    const getRes = await request(app.getHttpServer() as Server)
      .get(`/posts/${created.id}`)
      .expect(200);

    const fetched = getRes.body as { id: string; title: string };
    expect(fetched.id).toBe(created.id);
    expect(fetched.title).toBe(payload.title);
  });
});
