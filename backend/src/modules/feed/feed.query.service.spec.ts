import type { Repository } from 'typeorm';

import { FeedQueryService } from './feed.query.service';
import { Post } from '../post/entity/post.entity';
import { PostBlock } from '../post/entity/post-block.entity';
import { PostContributor } from '../post/entity/post-contributor.entity';
import { GroupMember } from '../group/entity/group_member.entity';
import { Group } from '../group/entity/group.entity';
import { PostDraft } from '../post/entity/post-draft.entity';
import { decodeFeedCursor } from './feed.helpers';

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

describe('FeedQueryService.getPastFeedForUser', () => {
  let postRepo: { createQueryBuilder: jest.Mock };
  let service: FeedQueryService;

  const buildService = (posts: Partial<Post>[]) => {
    const qb = createPostQueryBuilder(posts);
    postRepo = { createQueryBuilder: jest.fn().mockReturnValue(qb) };

    service = new FeedQueryService(
      postRepo as unknown as Repository<Post>,
      emptyFindRepo() as unknown as Repository<PostBlock>,
      emptyFindRepo() as unknown as Repository<PostContributor>,
      emptyFindRepo() as unknown as Repository<GroupMember>,
      emptyFindRepo() as unknown as Repository<Group>,
      emptyFindRepo() as unknown as Repository<PostDraft>,
    );
    return qb;
  };

  it('커서가 없으면 eventAt 조건 없이 최신순으로 limit만큼 조회한다', async () => {
    const qb = buildService([]);

    await service.getPastFeedForUser('user-1', undefined, 5);

    expect(qb.andWhere).not.toHaveBeenCalledWith(
      expect.stringContaining('eventAt <'),
      expect.anything(),
    );
    expect(qb.orderBy).toHaveBeenCalledWith('p.eventAt', 'DESC');
    expect(qb.take).toHaveBeenCalledWith(5);
  });

  it('커서가 있으면 해당 시각 이전 기록만 조회하도록 조건을 건다', async () => {
    const cursor = Buffer.from('2026-01-01T00:00:00.000Z', 'utf-8').toString(
      'base64',
    );
    const qb = buildService([]);

    await service.getPastFeedForUser('user-1', cursor, 5);

    expect(qb.andWhere).toHaveBeenCalledWith('p.eventAt < :cursorDate', {
      cursorDate: decodeFeedCursor(cursor),
    });
  });

  it('결과가 limit만큼 꽉 차면 마지막 항목 기준 nextCursor를 반환한다', async () => {
    const posts: Partial<Post>[] = [
      { id: 'p1', eventAt: new Date('2026-02-01T00:00:00.000Z'), tags: [] },
      { id: 'p2', eventAt: new Date('2026-01-31T00:00:00.000Z'), tags: [] },
    ];
    buildService(posts);

    const result = await service.getPastFeedForUser('user-1', undefined, 2);

    expect(result.nextCursor).not.toBeNull();
    expect(decodeFeedCursor(result.nextCursor)).toEqual(
      new Date('2026-01-31T00:00:00.000Z'),
    );
  });

  it('결과가 limit보다 적으면 더 볼 게 없다는 뜻으로 nextCursor는 null이다', async () => {
    const posts: Partial<Post>[] = [
      { id: 'p1', eventAt: new Date('2026-02-01T00:00:00.000Z'), tags: [] },
    ];
    buildService(posts);

    const result = await service.getPastFeedForUser('user-1', undefined, 5);

    expect(result.nextCursor).toBeNull();
  });

  it('과거 기록이 하나도 없으면(첫 페이지가 빈 배열) 프론트가 온보딩으로 분기할 수 있다', async () => {
    buildService([]);

    const result = await service.getPastFeedForUser('user-1', undefined, 10);

    expect(result.cards).toEqual([]);
    expect(result.nextCursor).toBeNull();
  });
});
