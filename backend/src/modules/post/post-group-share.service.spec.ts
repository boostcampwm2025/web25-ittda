import type { Repository } from 'typeorm';
import { BadRequestException, ForbiddenException } from '@nestjs/common';
import { PostGroupShareService } from './post-group-share.service';
import { Post } from './entity/post.entity';
import { PostGroupShare } from './entity/post-group-share.entity';
import { Group } from '@/modules/group/entity/group.entity';
import { GroupMember } from '@/modules/group/entity/group_member.entity';
import { GroupRoleEnum } from '@/enums/group-role.enum';
import { PostScope } from '@/enums/post-scope.enum';
import { GroupActivityType } from '@/enums/group-activity-type.enum';
import { GroupActivityService } from '@/modules/group/service/group-activity.service';

describe('PostGroupShareService', () => {
  let postRepo: { findOne: jest.Mock; manager: { transaction: jest.Mock } };
  let postGroupShareRepo: { find: jest.Mock; softDelete: jest.Mock };
  let groupRepo: { find: jest.Mock };
  let groupMemberRepo: { find: jest.Mock };
  let groupActivityService: { recordActivity: jest.Mock };
  let service: PostGroupShareService;

  let txShareRepo: { find: jest.Mock; create: jest.Mock; save: jest.Mock };
  let txGroupRepo: { update: jest.Mock };

  beforeEach(() => {
    txShareRepo = {
      find: jest.fn().mockResolvedValue([]),
      create: jest.fn((input: unknown) => input),
      save: jest.fn().mockResolvedValue(undefined),
    };
    txGroupRepo = { update: jest.fn().mockResolvedValue(undefined) };

    postRepo = {
      findOne: jest.fn(),
      manager: {
        transaction: jest.fn((cb: (manager: unknown) => unknown) =>
          cb({
            getRepository: (entity: unknown) =>
              entity === PostGroupShare ? txShareRepo : txGroupRepo,
          }),
        ),
      },
    };
    postGroupShareRepo = { find: jest.fn(), softDelete: jest.fn() };
    groupRepo = { find: jest.fn().mockResolvedValue([]) };
    groupMemberRepo = { find: jest.fn().mockResolvedValue([]) };
    groupActivityService = {
      recordActivity: jest.fn().mockResolvedValue(undefined),
    };

    service = new PostGroupShareService(
      postRepo as unknown as Repository<Post>,
      postGroupShareRepo as unknown as Repository<PostGroupShare>,
      groupRepo as unknown as Repository<Group>,
      groupMemberRepo as unknown as Repository<GroupMember>,
      groupActivityService as unknown as GroupActivityService,
    );
  });

  describe('shareToGroups', () => {
    it('GROUP scope 글은 공유할 수 없다', async () => {
      postRepo.findOne.mockResolvedValue({
        id: 'post-1',
        ownerUserId: 'user-1',
        scope: PostScope.GROUP,
        title: '제목',
      });

      await expect(
        service.shareToGroups('post-1', 'user-1', ['group-1']),
      ).rejects.toThrow(BadRequestException);
    });

    it('원작성자가 아니면 공유할 수 없다', async () => {
      postRepo.findOne.mockResolvedValue({
        id: 'post-1',
        ownerUserId: 'owner-1',
        scope: PostScope.PERSONAL,
        title: '제목',
      });

      await expect(
        service.shareToGroups('post-1', 'other-user', ['group-1']),
      ).rejects.toThrow(ForbiddenException);
    });

    it('대상 그룹의 멤버가 아니면 공유할 수 없다', async () => {
      postRepo.findOne.mockResolvedValue({
        id: 'post-1',
        ownerUserId: 'user-1',
        scope: PostScope.PERSONAL,
        title: '제목',
      });
      groupMemberRepo.find.mockResolvedValue([]);

      await expect(
        service.shareToGroups('post-1', 'user-1', ['group-1']),
      ).rejects.toThrow(ForbiddenException);
    });

    it('대상 그룹에서 VIEWER 권한이면 공유할 수 없다', async () => {
      postRepo.findOne.mockResolvedValue({
        id: 'post-1',
        ownerUserId: 'user-1',
        scope: PostScope.PERSONAL,
        title: '제목',
      });
      groupMemberRepo.find.mockResolvedValue([
        { groupId: 'group-1', role: GroupRoleEnum.VIEWER },
      ]);

      await expect(
        service.shareToGroups('post-1', 'user-1', ['group-1']),
      ).rejects.toThrow(ForbiddenException);
    });

    it('유효한 요청이면 그룹마다 공유 row를 만들고 활동을 1회씩 기록한다', async () => {
      postRepo.findOne.mockResolvedValue({
        id: 'post-1',
        ownerUserId: 'user-1',
        scope: PostScope.PERSONAL,
        title: '제목',
      });
      groupMemberRepo.find.mockResolvedValue([
        { groupId: 'group-1', role: GroupRoleEnum.ADMIN },
        { groupId: 'group-2', role: GroupRoleEnum.EDITOR },
      ]);
      postGroupShareRepo.find.mockResolvedValue([
        { groupId: 'group-1', groupName: '그룹1', sharedAt: new Date() },
        { groupId: 'group-2', groupName: '그룹2', sharedAt: new Date() },
      ]);
      groupRepo.find.mockResolvedValue([
        { id: 'group-1', name: '그룹1' },
        { id: 'group-2', name: '그룹2' },
      ]);

      const result = await service.shareToGroups('post-1', 'user-1', [
        'group-1',
        'group-2',
      ]);

      expect(txShareRepo.save).toHaveBeenCalledWith([
        { postId: 'post-1', groupId: 'group-1', sharedByUserId: 'user-1' },
        { postId: 'post-1', groupId: 'group-2', sharedByUserId: 'user-1' },
      ]);
      expect(txGroupRepo.update).toHaveBeenCalledWith('group-1', {
        lastActivityAt: expect.any(Date) as Date,
      });
      expect(txGroupRepo.update).toHaveBeenCalledWith('group-2', {
        lastActivityAt: expect.any(Date) as Date,
      });
      expect(groupActivityService.recordActivity).toHaveBeenCalledWith({
        groupId: 'group-1',
        type: GroupActivityType.POST_SHARE,
        actorIds: ['user-1'],
        refId: 'post-1',
        meta: { title: '제목' },
      });
      expect(groupActivityService.recordActivity).toHaveBeenCalledWith({
        groupId: 'group-2',
        type: GroupActivityType.POST_SHARE,
        actorIds: ['user-1'],
        refId: 'post-1',
        meta: { title: '제목' },
      });
      expect(result).toHaveLength(2);
    });

    it('이미 공유된 그룹은 멱등하게 건너뛴다(중복 row 생성 안 함)', async () => {
      postRepo.findOne.mockResolvedValue({
        id: 'post-1',
        ownerUserId: 'user-1',
        scope: PostScope.PERSONAL,
        title: '제목',
      });
      groupMemberRepo.find.mockResolvedValue([
        { groupId: 'group-1', role: GroupRoleEnum.ADMIN },
      ]);
      txShareRepo.find.mockResolvedValue([{ groupId: 'group-1' }]);
      postGroupShareRepo.find.mockResolvedValue([
        { groupId: 'group-1', groupName: '그룹1', sharedAt: new Date() },
      ]);
      groupRepo.find.mockResolvedValue([{ id: 'group-1', name: '그룹1' }]);

      await service.shareToGroups('post-1', 'user-1', ['group-1']);

      expect(txShareRepo.save).not.toHaveBeenCalled();
      expect(txGroupRepo.update).not.toHaveBeenCalled();
      expect(groupActivityService.recordActivity).not.toHaveBeenCalled();
    });
  });

  describe('listSharedGroups', () => {
    it('원작성자가 아니면 조회할 수 없다', async () => {
      postRepo.findOne.mockResolvedValue({
        id: 'post-1',
        ownerUserId: 'owner-1',
      });

      await expect(
        service.listSharedGroups('post-1', 'other-user'),
      ).rejects.toThrow(ForbiddenException);
    });

    it('공유된 그룹이 없으면 빈 배열을 반환한다', async () => {
      postRepo.findOne.mockResolvedValue({
        id: 'post-1',
        ownerUserId: 'user-1',
      });
      postGroupShareRepo.find.mockResolvedValue([]);

      const result = await service.listSharedGroups('post-1', 'user-1');

      expect(result).toEqual([]);
      expect(groupRepo.find).not.toHaveBeenCalled();
    });
  });

  describe('unshareFromGroup', () => {
    it('원작성자가 아니면 공유를 취소할 수 없다', async () => {
      postRepo.findOne.mockResolvedValue({
        id: 'post-1',
        ownerUserId: 'owner-1',
      });

      await expect(
        service.unshareFromGroup('post-1', 'other-user', 'group-1'),
      ).rejects.toThrow(ForbiddenException);
      expect(postGroupShareRepo.softDelete).not.toHaveBeenCalled();
    });

    it('원작성자면 해당 그룹 공유를 소프트 삭제하고, 알림 없이 활동 로그만 남긴다', async () => {
      postRepo.findOne.mockResolvedValue({
        id: 'post-1',
        ownerUserId: 'user-1',
        title: '제목',
      });

      await service.unshareFromGroup('post-1', 'user-1', 'group-1');

      expect(postGroupShareRepo.softDelete).toHaveBeenCalledWith({
        postId: 'post-1',
        groupId: 'group-1',
      });
      expect(groupActivityService.recordActivity).toHaveBeenCalledWith({
        groupId: 'group-1',
        type: GroupActivityType.POST_UNSHARE,
        actorIds: ['user-1'],
        refId: 'post-1',
        meta: { title: '제목' },
      });
    });
  });

  describe('isPostSharedWithUserViaAnyGroup', () => {
    it('EXISTS 조인 쿼리로 공유 여부를 확인한다', async () => {
      const qb = {
        innerJoin: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        getCount: jest.fn().mockResolvedValue(1),
      };
      (
        postGroupShareRepo as unknown as { createQueryBuilder: jest.Mock }
      ).createQueryBuilder = jest.fn().mockReturnValue(qb);

      const result = await service.isPostSharedWithUserViaAnyGroup(
        'post-1',
        'user-1',
      );

      expect(result).toBe(true);
      expect(qb.where).toHaveBeenCalledWith('pgs.post_id = :postId', {
        postId: 'post-1',
      });
    });
  });
});
