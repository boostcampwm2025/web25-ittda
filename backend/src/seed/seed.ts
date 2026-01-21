import type { Point } from 'geojson';

import dataSource from '../data-source';
import { Post } from '../modules/post/entity/post.entity';
import { PostBlock } from '../modules/post/entity/post-block.entity';
import { PostContributor } from '../modules/post/entity/post-contributor.entity';
import { PostDraft } from '../modules/post/entity/post-draft.entity';
import { User } from '../modules/user/user.entity';
import { Group } from '../modules/group/entity/group.entity';
import { GroupMember } from '../modules/group/entity/group_member.entity';
import { PostBlockType } from '../enums/post-block-type.enum';
import { PostScope } from '../enums/post-scope.enum';
import { PostContributorRole } from '../enums/post-contributor-role.enum';
import { GroupRoleEnum } from '../enums/group-role.enum';

type SeedBlock = {
  type: (typeof PostBlockType)[keyof typeof PostBlockType];
  value: Record<string, unknown>;
  layout: { row: number; col: number; span: number };
};

type SeedPost = {
  title: string;
  tags?: string[] | null;
  rating?: number | null;
  eventAt?: Date | null;
  location?: Point | null;
  blocks: SeedBlock[];
};

const SEED_IMAGE_URLS = [
  'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&q=80&w=800',
  'https://images.unsplash.com/photo-1492724441997-5dc865305da7?auto=format&fit=crop&q=80&w=800',
  'https://images.unsplash.com/photo-1470770841072-f978cf4d019e?auto=format&fit=crop&q=80&w=800',
];

// const DEV_USER = {
//   provider: 'kakao' as const,
//   providerId: 'dev-user-001',
//   nickname: 'dev-user',
//   email: 'dev@example.com',
// };

function makeSeedPosts(): SeedPost[] {
  return [
    {
      title: 'Seongsu popup outing',
      tags: ['popup', 'weekend', 'friends'],
      rating: 4,
      eventAt: new Date('2025-01-14T13:30:00Z'),
      blocks: [
        {
          type: PostBlockType.DATE,
          value: { date: '2025-01-14' },
          layout: { row: 1, col: 1, span: 1 },
        },
        {
          type: PostBlockType.TIME,
          value: { time: '13:30' },
          layout: { row: 1, col: 2, span: 1 },
        },
        {
          type: PostBlockType.TEXT,
          value: { text: 'Visited a popup store and grabbed limited merch.' },
          layout: { row: 2, col: 1, span: 2 },
        },
        {
          type: PostBlockType.TAG,
          value: { tags: ['popup', 'seongsu', 'weekend'] },
          layout: { row: 3, col: 1, span: 1 },
        },
        {
          type: PostBlockType.RATING,
          value: { rating: 4 },
          layout: { row: 3, col: 2, span: 1 },
        },
        {
          type: PostBlockType.IMAGE,
          value: { tempUrls: [SEED_IMAGE_URLS[0]] },
          layout: { row: 4, col: 1, span: 2 },
        },
      ],
    },
    {
      title: 'Late night movie',
      tags: ['movie', 'night'],
      rating: 5,
      eventAt: new Date('2025-02-03T20:15:00Z'),
      blocks: [
        {
          type: PostBlockType.DATE,
          value: { date: '2025-02-03' },
          layout: { row: 1, col: 1, span: 1 },
        },
        {
          type: PostBlockType.TIME,
          value: { time: '20:15' },
          layout: { row: 1, col: 2, span: 1 },
        },
        {
          type: PostBlockType.TEXT,
          value: { text: 'Watched a film and grabbed popcorn.' },
          layout: { row: 2, col: 1, span: 2 },
        },
        {
          type: PostBlockType.TAG,
          value: { tags: ['movie', 'popcorn'] },
          layout: { row: 3, col: 1, span: 1 },
        },
        {
          type: PostBlockType.RATING,
          value: { rating: 5 },
          layout: { row: 3, col: 2, span: 1 },
        },
        {
          type: PostBlockType.IMAGE,
          value: { tempUrls: [SEED_IMAGE_URLS[1]] },
          layout: { row: 4, col: 1, span: 2 },
        },
      ],
    },
    {
      title: 'Weekend cafe notes',
      tags: ['cafe', 'notes'],
      rating: 3,
      eventAt: new Date('2025-03-09T10:00:00Z'),
      blocks: [
        {
          type: PostBlockType.DATE,
          value: { date: '2025-03-09' },
          layout: { row: 1, col: 1, span: 1 },
        },
        {
          type: PostBlockType.TIME,
          value: { time: '10:00' },
          layout: { row: 1, col: 2, span: 1 },
        },
        {
          type: PostBlockType.TEXT,
          value: { text: 'Sketched ideas while drinking coffee.' },
          layout: { row: 2, col: 1, span: 2 },
        },
        {
          type: PostBlockType.TAG,
          value: { tags: ['cafe', 'morning'] },
          layout: { row: 3, col: 1, span: 1 },
        },
        {
          type: PostBlockType.RATING,
          value: { rating: 3 },
          layout: { row: 3, col: 2, span: 1 },
        },
        {
          type: PostBlockType.IMAGE,
          value: { tempUrls: [SEED_IMAGE_URLS[2]] },
          layout: { row: 4, col: 1, span: 2 },
        },
      ],
    },
  ];
}

async function upsertSeedOwner() {
  const userRepository = dataSource.getRepository(User);
  const existing = await userRepository.findOne({
    where: { provider: 'kakao', providerId: 'seed-owner' },
  });
  if (existing) return existing;

  const owner = userRepository.create({
    email: 'seed-owner@example.com',
    nickname: 'seed-owner',
    provider: 'kakao',
    providerId: 'seed-owner',
  });
  return userRepository.save(owner);
}

// async function upsertDevUser() {
//   const userRepository = dataSource.getRepository(User);
//   const existing = await userRepository.findOne({
//     where: { provider: DEV_USER.provider, providerId: DEV_USER.providerId },
//   });
//   if (existing) return existing;

//   const user = userRepository.create({
//     email: DEV_USER.email,
//     nickname: DEV_USER.nickname,
//     provider: DEV_USER.provider,
//     providerId: DEV_USER.providerId,
//   });
//   return userRepository.save(user);
// }

async function upsertSeedGroup(owner: User) {
  const groupRepository = dataSource.getRepository(Group);
  const existing = await groupRepository.findOne({
    where: { name: 'seed-group', owner: { id: owner.id } },
  });
  if (existing) return existing;

  const group = groupRepository.create({
    name: 'seed-group',
    owner,
  });
  return groupRepository.save(group);
}

async function ensureGroupMember(group: Group, user: User) {
  const memberRepository = dataSource.getRepository(GroupMember);
  const existing = await memberRepository.findOne({
    where: { groupId: group.id, userId: user.id },
  });
  if (existing) return existing;

  const member = memberRepository.create({
    groupId: group.id,
    userId: user.id,
    role: GroupRoleEnum.EDITOR,
    nicknameInGroup: user.nickname,
  });
  return memberRepository.save(member);
}

async function upsertSeedDraft(owner: User, group: Group) {
  const draftRepository = dataSource.getRepository(PostDraft);
  const existing = await draftRepository.findOne({
    where: { groupId: group.id, isActive: true },
  });
  if (existing) return existing;

  const draft = draftRepository.create({
    groupId: group.id,
    ownerActorId: owner.id,
    snapshot: {
      scope: PostScope.GROUP,
      groupId: group.id,
      title: '',
      blocks: [],
    },
  });
  return draftRepository.save(draft);
}

async function createSeedPost(owner: User, seed: SeedPost) {
  return dataSource.manager.transaction(async (manager) => {
    const postRepo = manager.getRepository(Post);
    const blockRepo = manager.getRepository(PostBlock);
    const contributorRepo = manager.getRepository(PostContributor);

    const post = postRepo.create({
      scope: PostScope.PERSONAL,
      ownerUserId: owner.id,
      ownerUser: owner,
      title: seed.title,
      eventAt: seed.eventAt ?? undefined,
      tags: seed.tags ?? null,
      rating: seed.rating ?? null,
      location: seed.location ?? undefined,
    });

    const saved = await postRepo.save(post);

    const contributor = contributorRepo.create({
      postId: saved.id,
      post: saved,
      userId: owner.id,
      user: owner,
      role: PostContributorRole.AUTHOR,
    });
    await contributorRepo.save(contributor);

    const blocks = seed.blocks.map((b) =>
      blockRepo.create({
        postId: saved.id,
        post: saved,
        type: b.type,
        value: b.value,
        layoutRow: b.layout.row,
        layoutCol: b.layout.col,
        layoutSpan: b.layout.span,
      }),
    );

    if (blocks.length > 0) {
      await blockRepo.save(blocks);
    }

    const blockCount = await blockRepo.count({ where: { postId: saved.id } });
    const contributorCount = await contributorRepo.count({
      where: { postId: saved.id },
    });
    console.log(
      `[seed] post=${saved.id} blocks=${blockCount} contributors=${contributorCount}`,
    );

    return saved.id;
  });
}

async function run() {
  await dataSource.initialize();

  try {
    const owner = await upsertSeedOwner();
    // const devUser = await upsertDevUser();
    const group = await upsertSeedGroup(owner);
    await ensureGroupMember(group, owner);
    // await ensureGroupMember(group, devUser);
    await upsertSeedDraft(owner, group);
    const seeds = makeSeedPosts();

    for (const seed of seeds) {
      await createSeedPost(owner, seed);
    }
  } finally {
    await dataSource.destroy();
  }
}

void run();
