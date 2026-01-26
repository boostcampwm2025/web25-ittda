import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
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
import { User } from '../src/modules/user/entity/user.entity';
import { Group } from '../src/modules/group/entity/group.entity';
import { GroupMember } from '../src/modules/group/entity/group_member.entity';
import { GoogleStrategy } from '../src/modules/auth/strategies/google.strategy';
import { KakaoStrategy } from '../src/modules/auth/strategies/kakao.strategy';
import { GroupRoleEnum } from '../src/enums/group-role.enum';

describe('FeedController (e2e)', () => {
  let app: INestApplication<App>;
  let userRepository: Repository<User>;
  let postRepository: Repository<Post>;
  let contributorRepository: Repository<PostContributor>;
  let postBlockRepository: Repository<PostBlock>;
  let groupRepository: Repository<Group>;
  let groupMemberRepository: Repository<GroupMember>;
  let owner: User;
  let otherUser: User;
  let group: Group;
  let ownedPost: Post;
  let contributedPost: Post;
  let otherDatePost: Post;
  let groupPost: Post;
  let accessToken: string;

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
    contributorRepository = app.get(getRepositoryToken(PostContributor));
    postBlockRepository = app.get(getRepositoryToken(PostBlock));
    groupRepository = app.get(getRepositoryToken(Group));
    groupMemberRepository = app.get(getRepositoryToken(GroupMember));
    const jwtService = app.get(JwtService);

    owner = await userRepository.save(
      userRepository.create({
        email: 'feed-owner@example.com',
        nickname: 'feed-owner',
        provider: 'kakao',
        providerId: `feed-owner-${Date.now()}`,
      }),
    );
    accessToken = jwtService.sign({ sub: owner.id });

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
    const eventAtOtherDay = new Date('2026-01-17T09:00:00+09:00');

    group = await groupRepository.save(
      groupRepository.create({
        name: 'feed-group',
        owner: { id: owner.id } as User,
      }),
    );
    await groupMemberRepository.save(
      groupMemberRepository.create({
        groupId: group.id,
        userId: owner.id,
        role: GroupRoleEnum.ADMIN,
        nicknameInGroup: owner.nickname,
      }),
    );

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

    otherDatePost = await postRepository.save(
      postRepository.create({
        scope: PostScope.PERSONAL,
        ownerUserId: owner.id,
        title: 'Other date post',
        eventAt: eventAtOtherDay,
      }),
    );

    groupPost = await postRepository.save(
      postRepository.create({
        scope: PostScope.GROUP,
        ownerUserId: owner.id,
        groupId: group.id,
        title: 'Group post',
        eventAt,
      }),
    );

    await contributorRepository.save(
      contributorRepository.create({
        postId: ownedPost.id,
        userId: owner.id,
        role: PostContributorRole.AUTHOR,
      }),
    );

    await contributorRepository.save(
      contributorRepository.create({
        postId: contributedPost.id,
        userId: owner.id,
        role: PostContributorRole.AUTHOR,
      }),
    );

    await contributorRepository.save(
      contributorRepository.create({
        postId: groupPost.id,
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
    if (
      ownedPost?.id ||
      contributedPost?.id ||
      otherDatePost?.id ||
      groupPost?.id
    ) {
      const postIds = [
        ownedPost?.id,
        contributedPost?.id,
        otherDatePost?.id,
        groupPost?.id,
      ].filter((id): id is string => Boolean(id));
      if (postIds.length > 0) {
        await postBlockRepository.delete({ postId: In(postIds) });
        await contributorRepository.delete({ postId: In(postIds) });
        await postRepository.delete({ id: In(postIds) });
      }
    }
    if (group?.id) {
      await groupMemberRepository.delete({ groupId: group.id });
      await groupRepository.delete({ id: group.id });
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
      .set('Authorization', `Bearer ${accessToken}`)
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
      [ownedPost.id, contributedPost.id, groupPost.id].sort(),
    );
    expect(body.data.find((item) => item.postId === otherDatePost.id)).toBe(
      undefined,
    );
    expect(body.meta.feedLength).toBe(3);
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

  it('GET /feed should filter by PERSONAL scope', async () => {
    const res = await request(app.getHttpServer())
      .get('/feed')
      .query({ date: '2026-01-16', tz: 'Asia/Seoul', scope: 'personal' })
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200);

    const body = res.body as { data: Array<{ postId: string }> };
    const postIds = body.data.map((item) => item.postId);
    expect(postIds).toEqual([ownedPost.id]);
    expect(postIds).not.toContain(groupPost.id);
  });

  it('GET /feed should filter by GROUP scope', async () => {
    const res = await request(app.getHttpServer())
      .get('/feed')
      .query({ date: '2026-01-16', tz: 'Asia/Seoul', scope: 'group' })
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200);

    const body = res.body as { data: Array<{ postId: string }> };
    const postIds = body.data.map((item) => item.postId);
    expect(postIds).toEqual([groupPost.id]);
  });

  it('GET /feed should return 400 without date', async () => {
    await request(app.getHttpServer())
      .get('/feed')
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(400);
  });

  it('GET /feed should return 400 for invalid date', async () => {
    await request(app.getHttpServer())
      .get('/feed')
      .query({ date: '2026-02-30', tz: 'Asia/Seoul' })
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(400);
  });

  it('GET /feed should return 400 for invalid tz', async () => {
    await request(app.getHttpServer())
      .get('/feed')
      .query({ date: '2026-02-28', tz: 'Not/AZone' })
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(400);
  });
});
