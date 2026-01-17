import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import request from 'supertest';
import type { App } from 'supertest/types';
import { getRepositoryToken } from '@nestjs/typeorm';
import type { Repository } from 'typeorm';

import { AppModule } from '../src/app.module';
import { PostScope } from '../src/enums/post-scope.enum';
import { Post } from '../src/modules/post/entity/post.entity';
import { User } from '../src/modules/user/user.entity';
import { GoogleStrategy } from '../src/modules/auth/strategies/google.strategy';
import { KakaoStrategy } from '../src/modules/auth/strategies/kakao.strategy';

describe('PostController (e2e)', () => {
  let app: INestApplication<App>;
  let userRepository: Repository<User>;
  let postRepository: Repository<Post>;
  let owner: User;
  let otherUser: User;
  let accessToken: string;
  let otherAccessToken: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(GoogleStrategy)
      .useValue({})
      .overrideProvider(KakaoStrategy)
      .useValue({})
      .compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );
    await app.init();

    userRepository = app.get(getRepositoryToken(User));
    postRepository = app.get(getRepositoryToken(Post));
    const jwtService = app.get(JwtService);

    owner = userRepository.create({
      email: 'test-post-owner@example.com',
      nickname: 'post-owner',
      provider: 'kakao',
      providerId: `test-${Date.now()}`,
    });
    owner = await userRepository.save(owner);
    accessToken = jwtService.sign({ sub: owner.id });

    otherUser = await userRepository.save(
      userRepository.create({
        email: 'test-post-other@example.com',
        nickname: 'post-other',
        provider: 'kakao',
        providerId: `test-other-${Date.now()}`,
      }),
    );
    otherAccessToken = jwtService.sign({ sub: otherUser.id });
  });

  afterAll(async () => {
    if (owner?.id) {
      await postRepository.delete({ ownerUserId: owner.id });
      await userRepository.delete({ id: owner.id });
    }
    if (otherUser?.id) {
      await userRepository.delete({ id: otherUser.id });
    }
    await app.close();
  });

  it('POST /posts should create a post and be retrievable', async () => {
    const payload = {
      scope: PostScope.PERSONAL,
      title: '테스트 제목',
      blocks: [
        {
          type: 'DATE',
          value: { date: '2025-01-14' },
          layout: { row: 1, col: 1, span: 1 },
        },
        {
          type: 'TIME',
          value: { time: '13:30' },
          layout: { row: 1, col: 2, span: 1 },
        },
        {
          type: 'TEXT',
          value: { text: '본문 테스트' },
          layout: { row: 2, col: 1, span: 2 },
        },
        {
          type: 'MOOD',
          value: { mood: '행복' },
          layout: { row: 3, col: 1, span: 1 },
        },
        {
          type: 'TAG',
          value: { tags: ['tag1', 'tag2'] },
          layout: { row: 3, col: 2, span: 1 },
        },
        {
          type: 'RATING',
          value: { rating: 4 },
          layout: { row: 4, col: 1, span: 1 },
        },
        {
          type: 'IMAGE',
          value: {
            tempUrls: [
              'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&q=80&w=800',
            ],
          },
          layout: { row: 5, col: 1, span: 2 },
        },
      ],
    };

    const createRes = await request(app.getHttpServer())
      .post('/posts')
      .set('Authorization', `Bearer ${accessToken}`)
      .send(payload)
      .expect(201);

    const created = createRes.body as {
      id: string;
      title: string;
      scope: PostScope;
      ownerUserId: string;
      blocks: Array<{ type: string; value?: { tempUrls?: string[] } }>;
      contributors: Array<{ userId: string; role: string }>;
    };

    expect(created.id).toBeDefined();
    expect(created.title).toBe(payload.title);
    expect(created.scope).toBe(payload.scope);
    expect(created.ownerUserId).toBe(owner.id);
    expect(created.blocks.length).toBeGreaterThan(0);
    expect(created.contributors[0]?.userId).toBe(owner.id);
    expect(
      created.blocks.find((b) => b.type === 'IMAGE')?.value?.tempUrls?.length,
    ).toBeGreaterThan(0);
    expect(created.blocks.find((b) => b.type === 'MOOD')?.value?.mood).toBe(
      '행복',
    );

    const getRes = await request(app.getHttpServer())
      .get(`/posts/${created.id}`)
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200);

    const fetched = getRes.body as {
      id: string;
      title: string;
      ownerUserId: string;
      blocks: Array<{ type: string }>;
      contributors: Array<{ userId: string; role: string }>;
    };

    expect(fetched.id).toBe(created.id);
    expect(fetched.title).toBe(payload.title);
    expect(fetched.ownerUserId).toBe(owner.id);
    expect(fetched.blocks.length).toBeGreaterThan(0);
    expect(fetched.contributors[0]?.userId).toBe(owner.id);
    expect(fetched.blocks.find((b) => b.type === 'MOOD')).toBeDefined();
  });

  it('DELETE /posts/:id should soft-delete and return 404 on fetch', async () => {
    const payload = {
      scope: PostScope.PERSONAL,
      title: '삭제 테스트',
      blocks: [
        {
          type: 'DATE',
          value: { date: '2025-01-14' },
          layout: { row: 1, col: 1, span: 1 },
        },
        {
          type: 'TIME',
          value: { time: '13:30' },
          layout: { row: 1, col: 2, span: 1 },
        },
        {
          type: 'TEXT',
          value: { text: '삭제 테스트 본문' },
          layout: { row: 2, col: 1, span: 2 },
        },
      ],
    };

    const createRes = await request(app.getHttpServer())
      .post('/posts')
      .set('Authorization', `Bearer ${accessToken}`)
      .send(payload)
      .expect(201);

    const created = createRes.body as { id: string };

    await request(app.getHttpServer())
      .delete(`/posts/${created.id}`)
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(204);

    const notFoundRes = await request(app.getHttpServer())
      .get(`/posts/${created.id}`)
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(404);

    expect(notFoundRes.body).toMatchObject({
      statusCode: 404,
      message: 'Post not found',
      error: 'Not Found',
    });
  });

  it('GET /posts/:id should return 403 for non-owner', async () => {
    const payload = {
      scope: PostScope.PERSONAL,
      title: '권한 테스트',
      blocks: [
        {
          type: 'DATE',
          value: { date: '2025-01-14' },
          layout: { row: 1, col: 1, span: 1 },
        },
        {
          type: 'TIME',
          value: { time: '13:30' },
          layout: { row: 1, col: 2, span: 1 },
        },
        {
          type: 'TEXT',
          value: { text: '권한 테스트 본문' },
          layout: { row: 2, col: 1, span: 2 },
        },
      ],
    };

    const createRes = await request(app.getHttpServer())
      .post('/posts')
      .set('Authorization', `Bearer ${accessToken}`)
      .send(payload)
      .expect(201);

    const created = createRes.body as { id: string };

    const forbiddenRes = await request(app.getHttpServer())
      .get(`/posts/${created.id}`)
      .set('Authorization', `Bearer ${otherAccessToken}`)
      .expect(403);

    expect(forbiddenRes.body).toMatchObject({
      statusCode: 403,
      message: 'You do not have access to this post',
      error: 'Forbidden',
    });
  });

  it('DELETE /posts/:id should return 403 for non-owner', async () => {
    const payload = {
      scope: PostScope.PERSONAL,
      title: '삭제 권한 테스트',
      blocks: [
        {
          type: 'DATE',
          value: { date: '2025-01-14' },
          layout: { row: 1, col: 1, span: 1 },
        },
        {
          type: 'TIME',
          value: { time: '13:30' },
          layout: { row: 1, col: 2, span: 1 },
        },
        {
          type: 'TEXT',
          value: { text: '삭제 권한 테스트 본문' },
          layout: { row: 2, col: 1, span: 2 },
        },
      ],
    };

    const createRes = await request(app.getHttpServer())
      .post('/posts')
      .set('Authorization', `Bearer ${accessToken}`)
      .send(payload)
      .expect(201);

    const created = createRes.body as { id: string };

    const forbiddenRes = await request(app.getHttpServer())
      .delete(`/posts/${created.id}`)
      .set('Authorization', `Bearer ${otherAccessToken}`)
      .expect(403);

    expect(forbiddenRes.body).toMatchObject({
      statusCode: 403,
      message: 'Only the owner can delete this post',
      error: 'Forbidden',
    });
  });

  it('POST /posts should return 400 when TEXT block is missing', async () => {
    const payload = {
      scope: PostScope.PERSONAL,
      title: '텍스트 없음',
      blocks: [
        {
          type: 'DATE',
          value: { date: '2025-01-14' },
          layout: { row: 1, col: 1, span: 1 },
        },
        {
          type: 'TIME',
          value: { time: '13:30' },
          layout: { row: 1, col: 2, span: 1 },
        },
      ],
    };

    const badRes = await request(app.getHttpServer())
      .post('/posts')
      .set('Authorization', `Bearer ${accessToken}`)
      .send(payload)
      .expect(400);

    expect(badRes.body).toMatchObject({
      statusCode: 400,
      message: 'TEXT block must exist at least once',
      error: 'Bad Request',
    });
  });

  it('POST /posts should return 400 when MOOD value is invalid', async () => {
    const payload = {
      scope: PostScope.PERSONAL,
      title: '감정 오류',
      blocks: [
        {
          type: 'DATE',
          value: { date: '2025-01-14' },
          layout: { row: 1, col: 1, span: 1 },
        },
        {
          type: 'TIME',
          value: { time: '13:30' },
          layout: { row: 1, col: 2, span: 1 },
        },
        {
          type: 'TEXT',
          value: { text: '감정 오류 테스트' },
          layout: { row: 2, col: 1, span: 2 },
        },
        {
          type: 'MOOD',
          value: { mood: '분노' },
          layout: { row: 3, col: 1, span: 1 },
        },
      ],
    };

    const badRes = await request(app.getHttpServer())
      .post('/posts')
      .set('Authorization', `Bearer ${accessToken}`)
      .send(payload)
      .expect(400);

    const badBody = badRes.body as {
      statusCode: number;
      error: string;
      message: string[];
    };

    expect(badBody).toMatchObject({
      statusCode: 400,
      error: 'Bad Request',
    });
    expect(Array.isArray(badBody.message)).toBe(true);
    expect(badBody.message.join(' ')).toContain(
      'mood must be one of: 행복, 슬픔, 설렘, 좋음, 놀람',
    );
  });
});
