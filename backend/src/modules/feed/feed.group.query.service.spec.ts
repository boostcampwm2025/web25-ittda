import {
  Brackets,
  type Repository,
  type WhereExpressionBuilder,
} from 'typeorm';

import { FeedGroupQueryService } from './feed.group.query.service';
import { Post } from '../post/entity/post.entity';
import { PostBlock } from '../post/entity/post-block.entity';
import { PostContributor } from '../post/entity/post-contributor.entity';
import { PostGroupShare } from '../post/entity/post-group-share.entity';
import { GroupMember } from '../group/entity/group_member.entity';
import { Group } from '../group/entity/group.entity';
import { PostDraft } from '../post/entity/post-draft.entity';
import { PostScope } from '@/enums/post-scope.enum';
import { decodeFeedCursor, encodeFeedCursor } from './feed.helpers';

type PostQueryBuilder = {
  where: jest.Mock;
  andWhere: jest.Mock;
  orderBy: jest.Mock;
  addOrderBy: jest.Mock;
  take: jest.Mock;
  select: jest.Mock;
  getMany: jest.Mock;
};

function createPostQueryBuilder(posts: Partial<Post>[]): PostQueryBuilder {
  return {
    where: jest.fn().mockReturnThis(),
    andWhere: jest.fn().mockReturnThis(),
    orderBy: jest.fn().mockReturnThis(),
    addOrderBy: jest.fn().mockReturnThis(),
    take: jest.fn().mockReturnThis(),
    select: jest.fn().mockReturnThis(),
    getMany: jest.fn().mockResolvedValue(posts),
  };
}

function emptyFindRepo() {
  return { find: jest.fn().mockResolvedValue([]) };
}

describe('FeedGroupQueryService.getPastFeedForGroup', () => {
  let postRepo: { createQueryBuilder: jest.Mock };
  let service: FeedGroupQueryService;

  const buildService = (posts: Partial<Post>[]) => {
    const qb = createPostQueryBuilder(posts);
    postRepo = { createQueryBuilder: jest.fn().mockReturnValue(qb) };

    service = new FeedGroupQueryService(
      postRepo as unknown as Repository<Post>,
      emptyFindRepo() as unknown as Repository<PostBlock>,
      emptyFindRepo() as unknown as Repository<PostContributor>,
      emptyFindRepo() as unknown as Repository<PostGroupShare>,
      emptyFindRepo() as unknown as Repository<GroupMember>,
      emptyFindRepo() as unknown as Repository<Group>,
      emptyFindRepo() as unknown as Repository<PostDraft>,
    );
    return qb;
  };

  it('그룹 소속 글 OR 이 그룹에 공유된 개인 글 조건으로 필터링하고, 커서가 없으면 최신순으로 limit만큼 조회한다', async () => {
    const qb = buildService([]);

    await service.getPastFeedForGroup('group-1', 'user-1', undefined, 5);

    expect(qb.where).toHaveBeenCalledTimes(1);
    const whereMock = qb.where as jest.Mock<unknown, [Brackets]>;
    const bracketsArg = whereMock.mock.calls[0][0];
    expect(bracketsArg).toBeInstanceOf(Brackets);

    // Brackets는 콜백을 whereFactory에 저장해두고 실제 실행 시점에 호출한다 —
    // 그 콜백에 stub qb를 직접 넘겨 내부 조건(where/orWhere)을 검증한다.
    const innerQb = {
      where: jest.fn().mockReturnThis(),
      orWhere: jest.fn().mockReturnThis(),
    };
    bracketsArg.whereFactory(innerQb as unknown as WhereExpressionBuilder);

    expect(innerQb.where).toHaveBeenCalledWith(
      'p.scope = :groupScope AND p.groupId = :groupId',
      { groupScope: 'GROUP', groupId: 'group-1' },
    );
    expect(innerQb.orWhere).toHaveBeenCalledWith(
      expect.stringContaining('post_group_shares'),
    );

    expect(qb.andWhere).not.toHaveBeenCalledWith(
      expect.stringContaining('eventAt <'),
      expect.anything(),
    );
    expect(qb.take).toHaveBeenCalledWith(5);
  });

  it('커서가 있으면 해당 시각+id 이전 기록만 조회하도록 튜플 비교 조건을 건다', async () => {
    const cursor = encodeFeedCursor(
      new Date('2026-01-01T00:00:00.000Z'),
      'p-cursor',
    );
    const qb = buildService([]);

    await service.getPastFeedForGroup('group-1', 'user-1', cursor, 5);

    expect(qb.andWhere).toHaveBeenCalledWith(
      '(p.eventAt < :cursorEventAt OR (p.eventAt = :cursorEventAt AND p.id < :cursorId))',
      {
        cursorEventAt: decodeFeedCursor(cursor)?.eventAt,
        cursorId: 'p-cursor',
      },
    );
  });

  it('결과가 limit만큼 꽉 차면 마지막 항목의 eventAt+id 기준 nextCursor를 반환한다', async () => {
    const posts: Partial<Post>[] = [
      { id: 'p1', eventAt: new Date('2026-02-01T00:00:00.000Z'), tags: [] },
      { id: 'p2', eventAt: new Date('2026-01-31T00:00:00.000Z'), tags: [] },
    ];
    buildService(posts);

    const result = await service.getPastFeedForGroup(
      'group-1',
      'user-1',
      undefined,
      2,
    );

    expect(result.nextCursor).not.toBeNull();
    expect(decodeFeedCursor(result.nextCursor)).toEqual({
      eventAt: new Date('2026-01-31T00:00:00.000Z'),
      id: 'p2',
    });
  });

  it('그룹에 기록이 하나도 없으면(첫 페이지가 빈 배열) 프론트가 온보딩으로 분기할 수 있다', async () => {
    buildService([]);

    const result = await service.getPastFeedForGroup(
      'group-1',
      'user-1',
      undefined,
      10,
    );

    expect(result.cards).toEqual([]);
    expect(result.nextCursor).toBeNull();
  });

  // 회귀 테스트: getPastFeedForGroup이 순수 GROUP 스코프 필터만 쓰던 시절엔
  // 이 그룹에 공유된 개인 글이 day 뷰(getGroupFeed)에는 보여도 무한스크롤
  // 피드에는 전혀 안 뜨는 버그가 있었다.
  it('이 그룹에 공유된 개인 글이 카드로 노출되고 isSharedPost/groupName이 채워진다', async () => {
    const posts: Partial<Post>[] = [
      {
        id: 'shared-1',
        scope: PostScope.PERSONAL,
        groupId: null,
        ownerUserId: 'owner-1',
        eventAt: new Date('2026-02-01T00:00:00.000Z'),
        tags: [],
      },
    ];
    const qb = createPostQueryBuilder(posts);
    postRepo = { createQueryBuilder: jest.fn().mockReturnValue(qb) };

    const shareRepo = {
      find: jest.fn().mockResolvedValue([{ postId: 'shared-1' }]),
    };
    const groupRepo = {
      find: jest.fn().mockResolvedValue([]),
      findOne: jest
        .fn()
        .mockResolvedValue({ id: 'group-1', name: '우리 그룹' }),
    };

    service = new FeedGroupQueryService(
      postRepo as unknown as Repository<Post>,
      emptyFindRepo() as unknown as Repository<PostBlock>,
      emptyFindRepo() as unknown as Repository<PostContributor>,
      shareRepo as unknown as Repository<PostGroupShare>,
      emptyFindRepo() as unknown as Repository<GroupMember>,
      groupRepo as unknown as Repository<Group>,
      emptyFindRepo() as unknown as Repository<PostDraft>,
    );

    const result = await service.getPastFeedForGroup(
      'group-1',
      'user-1',
      undefined,
      10,
    );

    expect(result.cards).toHaveLength(1);
    expect(result.cards[0]).toMatchObject({
      postId: 'shared-1',
      scope: 'GROUP',
      groupId: 'group-1',
      groupName: '우리 그룹',
      isSharedPost: true,
    });
  });
});
