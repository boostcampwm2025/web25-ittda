import type { Repository } from 'typeorm';

import { PostScope } from '@/enums/post-scope.enum';
import { PostBlockType } from '@/enums/post-block-type.enum';
import { Group } from '@/modules/group/entity/group.entity';
import { GroupMember } from '@/modules/group/entity/group_member.entity';
import { GroupActivityService } from '@/modules/group/service/group-activity.service';

import { PostDraftService } from './post-draft.service';
import { PostDraft } from './entity/post-draft.entity';
import { Post } from './entity/post.entity';
import { PostBlock } from './entity/post-block.entity';

describe('PostDraftService.applyPatch', () => {
  it('BLOCK_MOVE 후 스냅샷 배열도 레이아웃 좌표 순서로 저장한다', async () => {
    const firstId = '11111111-1111-4111-8111-111111111111';
    const secondId = '22222222-2222-4222-8222-222222222222';
    const draft = {
      id: '33333333-3333-4333-8333-333333333333',
      version: 4,
      isActive: true,
      snapshot: {
        scope: PostScope.GROUP,
        groupId: '44444444-4444-4444-8444-444444444444',
        title: '공동 기록',
        blocks: [
          {
            id: firstId,
            type: PostBlockType.DATE,
            value: { date: '2026-09-04' },
            layout: { row: 1, col: 1, span: 1 },
          },
          {
            id: secondId,
            type: PostBlockType.TIME,
            value: { time: '09:30' },
            layout: { row: 1, col: 2, span: 1 },
          },
        ],
      },
    } as unknown as PostDraft;

    const draftRepo = {
      findOne: jest.fn().mockResolvedValue(draft),
      save: jest.fn().mockResolvedValue(draft),
    };
    const mediaRepo = {
      delete: jest.fn().mockResolvedValue(undefined),
      create: jest.fn((input: unknown) => input),
      save: jest.fn().mockResolvedValue(undefined),
    };
    const manager = {
      getRepository: jest.fn((entity: unknown) =>
        entity === PostDraft ? draftRepo : mediaRepo,
      ),
    };
    const postDraftRepository = {
      manager: {
        transaction: jest.fn(
          (callback: (transactionManager: typeof manager) => unknown) =>
            callback(manager),
        ),
      },
    };
    const service = new PostDraftService(
      postDraftRepository as unknown as Repository<PostDraft>,
      {} as Repository<Post>,
      {} as Repository<PostBlock>,
      {} as Repository<Group>,
      {} as Repository<GroupMember>,
      {} as GroupActivityService,
    );

    const result = await service.applyPatch(draft.id, 4, {
      type: 'BLOCK_MOVE',
      moves: [
        {
          blockId: secondId,
          layout: { row: 1, col: 1, span: 1 },
        },
        {
          blockId: firstId,
          layout: { row: 1, col: 2, span: 1 },
        },
      ],
    });

    expect(result.status).toBe('committed');
    expect(
      (draft.snapshot.blocks as Array<{ id: string }>).map(({ id }) => id),
    ).toEqual([secondId, firstId]);
    expect(draft.version).toBe(5);
  });
});
