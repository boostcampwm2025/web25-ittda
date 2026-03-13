import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import request from 'supertest';
import type { App } from 'supertest/types';
import { getRepositoryToken } from '@nestjs/typeorm';
import type { Repository } from 'typeorm';

import { AppModule } from '../src/app.module';
import { GoogleStrategy } from '../src/modules/auth/strategies/google.strategy';
import { KakaoStrategy } from '../src/modules/auth/strategies/kakao.strategy';
import { User } from '../src/modules/user/entity/user.entity';
import { Group } from '../src/modules/group/entity/group.entity';
import { GroupMember } from '../src/modules/group/entity/group_member.entity';
import { UserMonthCover } from '../src/modules/user/entity/user-month-cover.entity';
import { GroupMonthCover } from '../src/modules/group/entity/group-month-cover.entity';
import { GroupRoleEnum } from '../src/enums/group-role.enum';

describe('Cover Reset API (e2e)', () => {
  let app: INestApplication<App>;
  let userRepository: Repository<User>;
  let groupRepository: Repository<Group>;
  let groupMemberRepository: Repository<GroupMember>;
  let userMonthCoverRepository: Repository<UserMonthCover>;
  let groupMonthCoverRepository: Repository<GroupMonthCover>;
  let user: User;
  let group: Group;
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
    groupRepository = app.get(getRepositoryToken(Group));
    groupMemberRepository = app.get(getRepositoryToken(GroupMember));
    userMonthCoverRepository = app.get(getRepositoryToken(UserMonthCover));
    groupMonthCoverRepository = app.get(getRepositoryToken(GroupMonthCover));
    const jwtService = app.get(JwtService);

    user = await userRepository.save(
      userRepository.create({
        email: 'cover-reset-owner@example.com',
        nickname: 'cover-owner',
        provider: 'kakao',
        providerId: `cover-owner-${Date.now()}`,
      }),
    );
    accessToken = jwtService.sign({ sub: user.id });

    group = await groupRepository.save(
      groupRepository.create({
        name: 'cover-reset-group',
        owner: { id: user.id } as User,
      }),
    );

    await groupMemberRepository.save(
      groupMemberRepository.create({
        groupId: group.id,
        userId: user.id,
        role: GroupRoleEnum.ADMIN,
        nicknameInGroup: user.nickname,
      }),
    );
  });

  afterAll(async () => {
    if (group?.id) {
      await groupMonthCoverRepository.delete({ groupId: group.id });
      await groupMemberRepository.delete({ groupId: group.id });
      await groupRepository.delete({ id: group.id });
    }
    if (user?.id) {
      await userMonthCoverRepository.delete({ userId: user.id });
      await userRepository.delete({ id: user.id });
    }
    if (app) await app.close();
  });

  it('DELETE /user/archives/months/:yyyy_mm/cover should clear custom user month cover', async () => {
    await userMonthCoverRepository.save(
      userMonthCoverRepository.create({
        userId: user.id,
        year: 2026,
        month: 3,
        coverAssetId: null,
      }),
    );

    const response = await request(app.getHttpServer())
      .delete('/user/archives/months/2026-03/cover')
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200);

    expect(response.body).toMatchObject({
      data: { coverAssetId: null },
    });

    const cover = await userMonthCoverRepository.findOne({
      where: { userId: user.id, year: 2026, month: 3 },
    });
    expect(cover).toBeNull();
  });

  it('DELETE /groups/:groupId/archives/months/:yyyy_mm/cover should clear custom group month cover', async () => {
    await groupMonthCoverRepository.save(
      groupMonthCoverRepository.create({
        groupId: group.id,
        year: 2026,
        month: 3,
        coverAssetId: null,
        sourcePostId: null,
      }),
    );

    const response = await request(app.getHttpServer())
      .delete(`/groups/${group.id}/archives/months/2026-03/cover`)
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200);

    expect(response.body).toMatchObject({
      data: { coverAssetId: null, sourcePostId: null },
    });

    const cover = await groupMonthCoverRepository.findOne({
      where: { groupId: group.id, year: 2026, month: 3 },
    });
    expect(cover).toBeNull();
  });

  it('DELETE /groups/:groupId/cover should reset group cover to default', async () => {
    const response = await request(app.getHttpServer())
      .delete(`/groups/${group.id}/cover`)
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200);

    expect(response.body).toMatchObject({
      data: { groupId: group.id, cover: null },
    });

    const updatedGroup = await groupRepository.findOne({
      where: { id: group.id },
    });
    expect(updatedGroup).not.toBeNull();
    expect(updatedGroup?.coverMediaId ?? null).toBeNull();
    expect(updatedGroup?.coverSourcePostId ?? null).toBeNull();
  });
});
