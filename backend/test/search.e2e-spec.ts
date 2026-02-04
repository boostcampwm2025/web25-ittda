import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import request from 'supertest';
import type { App } from 'supertest/types';
import { getRepositoryToken } from '@nestjs/typeorm';
import type { Repository } from 'typeorm';

import { AppModule } from '../src/app.module';
import { User } from '../src/modules/user/entity/user.entity';
import { Post } from '../src/modules/post/entity/post.entity';
import { PostBlock } from '../src/modules/post/entity/post-block.entity';
import { PostScope } from '../src/enums/post-scope.enum';
import { PostBlockType } from '../src/enums/post-block-type.enum';
import { GoogleStrategy } from '../src/modules/auth/strategies/google.strategy';
import { KakaoStrategy } from '../src/modules/auth/strategies/kakao.strategy';

describe('SearchController (e2e)', () => {
  let app: INestApplication<App>;
  let userRepository: Repository<User>;
  let postRepository: Repository<Post>;
  let postBlockRepository: Repository<PostBlock>;
  let accessToken: string;
  let user: User;
  let titlePost: Post;
  let textPost: Post;

  type SearchItemsResponse = {
    items: Array<{ id: string }>;
  };

  const isSearchItemsResponse = (
    value: unknown,
  ): value is SearchItemsResponse => {
    if (!value || typeof value !== 'object') return false;
    if (!('items' in value)) return false;
    const items = (value as { items?: unknown }).items;
    return (
      Array.isArray(items) &&
      items.every(
        (item) =>
          typeof item === 'object' &&
          item !== null &&
          'id' in item &&
          typeof (item as { id?: unknown }).id === 'string',
      )
    );
  };

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
    postBlockRepository = app.get(getRepositoryToken(PostBlock));
    const jwtService = app.get(JwtService);

    user = await userRepository.save(
      userRepository.create({
        email: 'search-owner@example.com',
        nickname: 'search-owner',
        provider: 'kakao',
        providerId: `search-owner-${Date.now()}`,
      }),
    );
    accessToken = jwtService.sign({ sub: user.id });

    const eventAtToday = new Date('2026-02-03T09:30:00+09:00');
    const eventAtYesterday = new Date('2026-02-02T09:30:00+09:00');

    titlePost = await postRepository.save(
      postRepository.create({
        scope: PostScope.PERSONAL,
        ownerUserId: user.id,
        title: '오늘의 기록',
        eventAt: eventAtToday,
      }),
    );

    textPost = await postRepository.save(
      postRepository.create({
        scope: PostScope.PERSONAL,
        ownerUserId: user.id,
        title: '다른 제목',
        eventAt: eventAtYesterday,
      }),
    );

    await postBlockRepository.save(
      postBlockRepository.create({
        postId: textPost.id,
        type: PostBlockType.TEXT,
        value: { text: '오늘 기록은 텍스트에만 있습니다.' },
        layoutRow: 1,
        layoutCol: 1,
        layoutSpan: 1,
      }),
    );
  });

  afterAll(async () => {
    await app.close();
  });

  it('키워드가 제목 또는 텍스트 블록에 포함된 글을 반환한다', async () => {
    const res = await request(app.getHttpServer())
      .post('/search')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ keyword: '기록' })
      .expect(201);

    const body = res.body as unknown;
    expect(isSearchItemsResponse(body)).toBe(true);
    const ids = (body as SearchItemsResponse).items.map((item) => item.id);
    expect(ids).toContain(titlePost.id);
    expect(ids).toContain(textPost.id);
  });

  it('기간 필터로 해당 날짜 범위의 글만 반환한다', async () => {
    const res = await request(app.getHttpServer())
      .post('/search')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        startDate: '2026-02-03T00:00:00+09:00',
        endDate: '2026-02-03T23:59:59+09:00',
      })
      .expect(201);

    const body = res.body as unknown;
    expect(isSearchItemsResponse(body)).toBe(true);
    const ids = (body as SearchItemsResponse).items.map((item) => item.id);
    expect(ids).toContain(titlePost.id);
    expect(ids).not.toContain(textPost.id);
  });
});
