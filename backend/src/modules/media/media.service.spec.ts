import { ConfigService } from '@nestjs/config';
import type { Repository, EntityManager } from 'typeorm';

import { MediaService } from './media.service';
import { MediaAsset, MediaAssetStatus } from './entity/media-asset.entity';
import { PostDraftMedia } from '@/modules/post/entity/post-draft-media.entity';
import { PostDraft } from '@/modules/post/entity/post-draft.entity';
import { PostMedia } from '@/modules/post/entity/post-media.entity';
import { Post } from '@/modules/post/entity/post.entity';
import { PostContributor } from '@/modules/post/entity/post-contributor.entity';
import { GroupMember } from '@/modules/group/entity/group_member.entity';
import { Group } from '@/modules/group/entity/group.entity';
import { GroupMonthCover } from '@/modules/group/entity/group-month-cover.entity';
import { User } from '@/modules/user/entity/user.entity';
import { UserMonthCover } from '@/modules/user/entity/user-month-cover.entity';

type RawMediaIdQueryBuilder = {
  innerJoin: jest.Mock;
  select: jest.Mock;
  where: jest.Mock;
  andWhere: jest.Mock;
  getRawMany: jest.Mock;
};

function createRawMediaIdQueryBuilder(
  rows: Array<{ mediaId: string }> = [],
): RawMediaIdQueryBuilder {
  return {
    innerJoin: jest.fn().mockReturnThis(),
    select: jest.fn().mockReturnThis(),
    where: jest.fn().mockReturnThis(),
    andWhere: jest.fn().mockReturnThis(),
    getRawMany: jest.fn().mockResolvedValue(rows),
  };
}

describe('MediaService', () => {
  let configService: { get: jest.Mock };
  let mediaAssetRepository: {
    find: jest.Mock;
    update: jest.Mock;
    delete: jest.Mock;
    increment: jest.Mock;
  };
  let postDraftMediaQueryBuilder: RawMediaIdQueryBuilder;
  let postMediaQueryBuilder: RawMediaIdQueryBuilder;
  let postDraftMediaRepository: {
    createQueryBuilder: jest.Mock;
  };
  let postMediaRepository: {
    createQueryBuilder: jest.Mock;
  };
  let groupMemberRepository: {
    find: jest.Mock;
  };
  let groupRepository: {
    find: jest.Mock;
  };
  let groupMonthCoverRepository: {
    find: jest.Mock;
  };
  let userRepository: {
    find: jest.Mock;
  };
  let userMonthCoverRepository: {
    find: jest.Mock;
  };
  let s3Send: jest.Mock;
  let service: MediaService;

  beforeEach(() => {
    configService = {
      get: jest.fn((key: string) => {
        const values: Record<string, string> = {
          S3_ENDPOINT: 'https://s3.example.com',
          S3_PUBLIC_ENDPOINT: 'https://cdn.example.com',
          S3_REGION: 'us-east-1',
          S3_ACCESS_KEY: 'access-key',
          S3_SECRET_KEY: 'secret-key',
          S3_BUCKET: 'bucket',
          S3_FORCE_PATH_STYLE: 'true',
        };
        return values[key];
      }),
    };
    mediaAssetRepository = {
      find: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      increment: jest.fn(),
    };
    postDraftMediaQueryBuilder = createRawMediaIdQueryBuilder();
    postMediaQueryBuilder = createRawMediaIdQueryBuilder();
    postDraftMediaRepository = {
      createQueryBuilder: jest.fn().mockReturnValue(postDraftMediaQueryBuilder),
    };
    postMediaRepository = {
      createQueryBuilder: jest.fn().mockReturnValue(postMediaQueryBuilder),
    };
    groupMemberRepository = {
      find: jest.fn().mockResolvedValue([]),
    };
    groupRepository = {
      find: jest.fn().mockResolvedValue([]),
    };
    groupMonthCoverRepository = {
      find: jest.fn().mockResolvedValue([]),
    };
    userRepository = {
      find: jest.fn().mockResolvedValue([]),
    };
    userMonthCoverRepository = {
      find: jest.fn().mockResolvedValue([]),
    };

    service = new MediaService(
      configService as unknown as ConfigService,
      mediaAssetRepository as unknown as Repository<MediaAsset>,
      postDraftMediaRepository as unknown as Repository<PostDraftMedia>,
      {} as Repository<PostDraft>,
      postMediaRepository as unknown as Repository<PostMedia>,
      {} as Repository<Post>,
      {} as Repository<PostContributor>,
      groupMemberRepository as unknown as Repository<GroupMember>,
      groupRepository as unknown as Repository<Group>,
      groupMonthCoverRepository as unknown as Repository<GroupMonthCover>,
      userRepository as unknown as Repository<User>,
      userMonthCoverRepository as unknown as Repository<UserMonthCover>,
    );

    s3Send = jest.fn();
    Object.assign(service as object, {
      s3Client: { send: s3Send },
    });
  });

  it('marks unique READY media ids as deletion candidates', async () => {
    mediaAssetRepository.update.mockResolvedValue({ affected: 2 });
    const manager = {
      getRepository: jest.fn().mockReturnValue(mediaAssetRepository),
    } as unknown as EntityManager;

    const candidateIds = await service.markMediaDeletionCandidatesWithManager(
      manager,
      ['asset-1', 'asset-1', 'asset-2'],
    );

    expect(candidateIds).toEqual(['asset-1', 'asset-2']);
    expect(mediaAssetRepository.update).toHaveBeenCalledTimes(1);

    const [criteria, payload] = mediaAssetRepository.update.mock.calls[0] as [
      { id: unknown; status: MediaAssetStatus },
      {
        deleteRequestedAt: Date;
        deleteRetryCount: number;
        lastDeleteError: null;
      },
    ];

    expect(criteria.status).toBe(MediaAssetStatus.READY);
    expect(criteria.id).toBeDefined();
    expect(payload.deleteRequestedAt).toBeInstanceOf(Date);
    expect(payload.deleteRetryCount).toBe(0);
    expect(payload.lastDeleteError).toBeNull();
  });

  it('deletes orphan assets from storage and then removes their rows', async () => {
    mediaAssetRepository.find.mockResolvedValue([
      { id: 'asset-1', storageKey: 'media/user-1/asset-1' },
    ]);
    mediaAssetRepository.delete.mockResolvedValue({ affected: 1 });
    s3Send.mockResolvedValue({});

    await (
      service as unknown as {
        processPendingMediaDeletionCandidates: (
          mediaIds: string[],
        ) => Promise<void>;
      }
    ).processPendingMediaDeletionCandidates(['asset-1']);

    expect(s3Send).toHaveBeenCalledTimes(1);
    expect(mediaAssetRepository.delete).toHaveBeenCalledWith(['asset-1']);
    expect(mediaAssetRepository.increment).not.toHaveBeenCalled();
  });

  it('restores candidates when the media becomes referenced again', async () => {
    mediaAssetRepository.find.mockResolvedValue([
      { id: 'asset-1', storageKey: 'media/user-1/asset-1' },
    ]);
    userRepository.find.mockResolvedValue([{ profileImageId: 'asset-1' }]);
    mediaAssetRepository.update.mockResolvedValue({ affected: 1 });

    await (
      service as unknown as {
        processPendingMediaDeletionCandidates: (
          mediaIds: string[],
        ) => Promise<void>;
      }
    ).processPendingMediaDeletionCandidates(['asset-1']);

    expect(mediaAssetRepository.update).toHaveBeenCalledWith(
      expect.any(Object),
      {
        deleteRequestedAt: null,
        deleteRetryCount: 0,
        lastDeleteError: null,
      },
    );
    expect(s3Send).not.toHaveBeenCalled();
    expect(mediaAssetRepository.delete).not.toHaveBeenCalled();
  });

  it('keeps the row and records retry metadata when storage deletion fails', async () => {
    mediaAssetRepository.find.mockResolvedValue([
      { id: 'asset-1', storageKey: 'media/user-1/asset-1' },
    ]);
    mediaAssetRepository.increment.mockResolvedValue({ affected: 1 });
    mediaAssetRepository.update.mockResolvedValue({ affected: 1 });
    s3Send.mockRejectedValue(new Error('boom'));

    await (
      service as unknown as {
        processPendingMediaDeletionCandidates: (
          mediaIds: string[],
        ) => Promise<void>;
      }
    ).processPendingMediaDeletionCandidates(['asset-1']);

    expect(mediaAssetRepository.increment).toHaveBeenCalledWith(
      { id: 'asset-1' },
      'deleteRetryCount',
      1,
    );
    expect(mediaAssetRepository.update).toHaveBeenCalledWith(
      { id: 'asset-1' },
      { lastDeleteError: 'boom' },
    );
    expect(mediaAssetRepository.delete).not.toHaveBeenCalled();
  });
});
