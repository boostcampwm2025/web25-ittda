import { Test, TestingModule } from '@nestjs/testing';
import type { INestApplication } from '@nestjs/common';
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
import { JwtStrategy } from '../src/modules/auth/jwt/jwt.strategy';

describe('PostController (e2e)', () => {
  let app: INestApplication<App>;
  let userRepository: Repository<User>;
  let postRepository: Repository<Post>;
  let owner: User;

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
    await app.init();

    userRepository = app.get(getRepositoryToken(User));
    postRepository = app.get(getRepositoryToken(Post));

    owner = userRepository.create({
      email: 'test-post-owner@example.com',
      nickname: 'post-owner',
      provider: 'kakao',
      providerId: `test-${Date.now()}`,
    });
    owner = await userRepository.save(owner);
  });

  afterAll(async () => {
    if (owner?.id) {
      await postRepository.delete({ ownerUserId: owner.id });
      await userRepository.delete({ id: owner.id });
    }
    await app.close();
  });

  it('POST /posts should create a post and be retrievable', async () => {
    const payload = {
      scope: PostScope.PERSONAL,
      title: '테스트 제목',
      tags: ['tag1', 'tag2'],
      rating: 4,
    };

    const createRes = await request(app.getHttpServer())
      .post('/posts')
      .set('x-user-id', owner.id)
      .send(payload)
      .expect(201);

    const created = createRes.body as {
      id: string;
      title: string;
      scope: PostScope;
      ownerUserId: string;
    };

    expect(created.id).toBeDefined();
    expect(created.title).toBe(payload.title);
    expect(created.scope).toBe(payload.scope);
    expect(created.ownerUserId).toBe(owner.id);

    const getRes = await request(app.getHttpServer())
      .get(`/posts/${created.id}`)
      .expect(200);

    const fetched = getRes.body as {
      id: string;
      title: string;
      ownerUserId: string;
    };

    expect(fetched.id).toBe(created.id);
    expect(fetched.title).toBe(payload.title);
    expect(fetched.ownerUserId).toBe(owner.id);
  });
});
