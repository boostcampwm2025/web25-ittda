import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import type { App } from 'supertest/types';
import { getRepositoryToken } from '@nestjs/typeorm';
import { In } from 'typeorm';
import type { Repository } from 'typeorm';

import { AppModule } from '../src/app.module';
import { PostScope } from '../src/enums/post-scope.enum';
import { PostContributorRole } from '../src/enums/post-contributor-role.enum';
import { PostBlockType } from '../src/enums/post-block-type.enum';
import { Post } from '../src/modules/post/entity/post.entity';
import { PostContributor } from '../src/modules/post/entity/post-contributor.entity';
import { PostBlock } from '../src/modules/post/entity/post-block.entity';
import { User } from '../src/modules/user/user.entity';
import { GoogleStrategy } from '../src/modules/auth/strategies/google.strategy';
import { KakaoStrategy } from '../src/modules/auth/strategies/kakao.strategy';
import { JwtStrategy } from '../src/modules/auth/jwt/jwt.strategy';

describe('FeedController (e2e)', () => {
  let app: INestApplication<App>;
  let userRepository: Repository<User>;
  let postRepository: Repository<Post>;
  let contributorRepository: Repository<PostContributor>;
  let postBlockRepository: Repository<PostBlock>;
  let owner: User;
  let otherUser: User;
  let ownedPost: Post;
  let contributedPost: Post;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(GoogleStrategy)
      .useValue({})
      .overrideProvider(KakaoStrategy)
      .useValue({})
      .overrideProvider(JwtStrategy)
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
    contributorRepository = app.get(getRepositoryToken(PostContributor));
    postBlockRepository = app.get(getRepositoryToken(PostBlock));

    owner = await userRepository.save(
      userRepository.create({
        email: 'feed-owner@example.com',
        nickname: 'feed-owner',
        provider: 'kakao',
        providerId: `feed-owner-${Date.now()}`,
      }),
    );

    otherUser = await userRepository.save(
      userRepository.create({
        email: 'feed-other@example.com',
        nickname: 'feed-other',
        provider: 'kakao',
        providerId: `feed-other-${Date.now()}`,
      }),
    );

    const eventAt = new Date('2026-01-16T09:10:00+09:00');
    const eventAtLater = new Date('2026-01-16T12:20:00+09:00');

    ownedPost = await postRepository.save(
      postRepository.create({
        scope: PostScope.PERSONAL,
        ownerUserId: owner.id,
        title: 'Owned post',
        eventAt,
        tags: ['tag1'],
        rating: 5,
      }),
    );

    contributedPost = await postRepository.save(
      postRepository.create({
        scope: PostScope.PERSONAL,
        ownerUserId: otherUser.id,
        title: 'Contributed post',
        eventAt: eventAtLater,
      }),
    );

    await contributorRepository.save(
      contributorRepository.create({
        postId: contributedPost.id,
        userId: owner.id,
        role: PostContributorRole.AUTHOR,
      }),
    );

    await postBlockRepository.save(
      postBlockRepository.create({
        postId: ownedPost.id,
        type: PostBlockType.LOCATION,
        value: {
          lat: 37.5665,
          lng: 126.978,
          address: 'Seoul',
          placeName: 'City Hall',
        },
        layoutRow: 1,
        layoutCol: 1,
        layoutSpan: 1,
      }),
    );
  });

  afterAll(async () => {
    if (ownedPost?.id || contributedPost?.id) {
      const postIds = [ownedPost?.id, contributedPost?.id].filter(
        (id): id is string => Boolean(id),
      );
      if (postIds.length > 0) {
        await postBlockRepository.delete({ postId: In(postIds) });
        await contributorRepository.delete({ postId: In(postIds) });
        await postRepository.delete({ id: In(postIds) });
      }
    }
    if (owner?.id) {
      await userRepository.delete({ id: owner.id });
    }
    if (otherUser?.id) {
      await userRepository.delete({ id: otherUser.id });
    }
    await app.close();
  });

  it('GET /feed should return owned and contributed posts with meta', async () => {
    const res = await request(app.getHttpServer())
      .get('/feed')
      .query({ date: '2026-01-16', tz: 'Asia/Seoul' })
      .set('x-user-id', owner.id)
      .expect(200);

    const body = res.body as {
      data: Array<{
        postId: string;
        title: string;
        location: { lat: number; lng: number } | null;
        blocks: Array<{
          type: string;
          layout: { row: number; col: number; span: number };
        }>;
      }>;
      meta: { warnings: unknown[]; feedLength: number };
    };

    expect(body.data.map((item) => item.postId).sort()).toEqual(
      [ownedPost.id, contributedPost.id].sort(),
    );
    expect(Array.isArray(body.meta.warnings)).toBe(true);
    expect(body.meta.feedLength).toBe(body.data.length);

    const ownedCard = body.data.find((item) => item.postId === ownedPost.id);
    expect(ownedCard?.title).toBe('Owned post');
    expect(ownedCard?.location?.lat).toBe(37.5665);
    expect(ownedCard?.blocks.length).toBeGreaterThan(0);

    const contributedCard = body.data.find(
      (item) => item.postId === contributedPost.id,
    );
    expect(contributedCard?.blocks.length).toBe(0);
  });

  it('GET /feed should return 400 without date', async () => {
    await request(app.getHttpServer())
      .get('/feed')
      .set('x-user-id', owner.id)
      .expect(400);
  });
});
