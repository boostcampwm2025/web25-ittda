import {
  Injectable,
  BadRequestException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, IsNull, Repository } from 'typeorm';

import { Post } from './entity/post.entity';
import { PostGroupShare } from './entity/post-group-share.entity';
import { Group } from '@/modules/group/entity/group.entity';
import { GroupMember } from '@/modules/group/entity/group_member.entity';
import { GroupRoleEnum } from '@/enums/group-role.enum';
import { GroupActivityType } from '@/enums/group-activity-type.enum';
import { GroupActivityService } from '@/modules/group/service/group-activity.service';
import { PostScope } from '@/enums/post-scope.enum';
import { PostGroupShareDto } from './dto/post-group-share.dto';

@Injectable()
export class PostGroupShareService {
  constructor(
    @InjectRepository(Post)
    private readonly postRepository: Repository<Post>,
    @InjectRepository(PostGroupShare)
    private readonly postGroupShareRepository: Repository<PostGroupShare>,
    @InjectRepository(Group)
    private readonly groupRepository: Repository<Group>,
    @InjectRepository(GroupMember)
    private readonly groupMemberRepository: Repository<GroupMember>,
    private readonly groupActivityService: GroupActivityService,
  ) {}

  async shareToGroups(
    postId: string,
    ownerUserId: string,
    groupIds: string[],
  ): Promise<PostGroupShareDto[]> {
    const post = await this.postRepository.findOne({
      where: { id: postId, deletedAt: IsNull() },
      select: { id: true, ownerUserId: true, scope: true, title: true },
    });
    if (!post) throw new NotFoundException('Post not found');
    if (post.scope !== PostScope.PERSONAL) {
      throw new BadRequestException(
        'Only personal posts can be shared to groups.',
      );
    }
    if (post.ownerUserId !== ownerUserId) {
      throw new ForbiddenException('Only the owner can share this post.');
    }

    const uniqueGroupIds = Array.from(new Set(groupIds));
    const members = await this.groupMemberRepository.find({
      where: { groupId: In(uniqueGroupIds), userId: ownerUserId },
      select: { groupId: true, role: true },
    });
    const memberByGroupId = new Map(members.map((m) => [m.groupId, m]));
    for (const groupId of uniqueGroupIds) {
      const member = memberByGroupId.get(groupId);
      if (!member) {
        throw new ForbiddenException(
          'Not a member of one or more target groups.',
        );
      }
      if (member.role === GroupRoleEnum.VIEWER) {
        throw new ForbiddenException('Insufficient permission.');
      }
    }

    await this.postRepository.manager.transaction(async (manager) => {
      const shareRepo = manager.getRepository(PostGroupShare);
      const groupRepo = manager.getRepository(Group);

      const existingShares = await shareRepo.find({
        where: { postId, groupId: In(uniqueGroupIds), deletedAt: IsNull() },
        select: { groupId: true },
      });
      const alreadySharedGroupIds = new Set(
        existingShares.map((s) => s.groupId),
      );
      const newGroupIds = uniqueGroupIds.filter(
        (groupId) => !alreadySharedGroupIds.has(groupId),
      );

      if (newGroupIds.length > 0) {
        const shares = newGroupIds.map((groupId) =>
          shareRepo.create({ postId, groupId, sharedByUserId: ownerUserId }),
        );
        await shareRepo.save(shares);

        await Promise.all(
          newGroupIds.map((groupId) =>
            groupRepo.update(groupId, { lastActivityAt: new Date() }),
          ),
        );
      }
    });

    await Promise.all(
      uniqueGroupIds.map((groupId) =>
        this.groupActivityService.recordActivity({
          groupId,
          type: GroupActivityType.POST_SHARE,
          actorIds: [ownerUserId],
          refId: postId,
          meta: { title: post.title },
        }),
      ),
    );

    return this.listSharedGroups(postId, ownerUserId);
  }

  async listSharedGroups(
    postId: string,
    requesterId: string,
  ): Promise<PostGroupShareDto[]> {
    const post = await this.postRepository.findOne({
      where: { id: postId, deletedAt: IsNull() },
      select: { id: true, ownerUserId: true },
    });
    if (!post) throw new NotFoundException('Post not found');
    if (post.ownerUserId !== requesterId) {
      throw new ForbiddenException('Only the owner can view sharing status.');
    }

    const shares = await this.postGroupShareRepository.find({
      where: { postId, deletedAt: IsNull() },
      order: { createdAt: 'DESC' },
    });
    if (shares.length === 0) return [];

    const groups = await this.groupRepository.find({
      where: { id: In(shares.map((s) => s.groupId)) },
      select: ['id', 'name'],
    });
    const groupNameById = new Map(groups.map((g) => [g.id, g.name]));

    return shares.map((share) => ({
      groupId: share.groupId,
      groupName: groupNameById.get(share.groupId) ?? '알 수 없음',
      sharedAt: share.createdAt,
    }));
  }

  async unshareFromGroup(
    postId: string,
    requesterId: string,
    groupId: string,
  ): Promise<void> {
    const post = await this.postRepository.findOne({
      where: { id: postId, deletedAt: IsNull() },
      select: { id: true, ownerUserId: true, title: true },
    });
    if (!post) throw new NotFoundException('Post not found');
    if (post.ownerUserId !== requesterId) {
      throw new ForbiddenException('Only the owner can unshare this post.');
    }

    await this.postGroupShareRepository.softDelete({ postId, groupId });

    // 공유 취소는 알림을 보내지 않는다(NOTIFYING_TYPES에 미포함) — 다만
    // 그룹 활동 로그에는 남겨서 "왜 이 글이 안 보이게 됐는지" 나중에라도
    // 확인할 수 있게 한다.
    await this.groupActivityService.recordActivity({
      groupId,
      type: GroupActivityType.POST_UNSHARE,
      actorIds: [requesterId],
      refId: postId,
      meta: { title: post.title },
    });
  }

  async isPostSharedWithUserViaAnyGroup(
    postId: string,
    userId: string,
  ): Promise<boolean> {
    const count = await this.postGroupShareRepository
      .createQueryBuilder('pgs')
      .innerJoin(
        GroupMember,
        'gm',
        'gm.group_id = pgs.group_id AND gm.deleted_at IS NULL',
      )
      .where('pgs.post_id = :postId', { postId })
      .andWhere('pgs.deleted_at IS NULL')
      .andWhere('gm.user_id = :userId', { userId })
      .getCount();
    return count > 0;
  }

  async getSharedGroupIds(postId: string): Promise<string[]> {
    const shares = await this.postGroupShareRepository.find({
      where: { postId, deletedAt: IsNull() },
      select: { groupId: true },
    });
    return shares.map((s) => s.groupId);
  }

  // 특정 그룹에 실제로 공유돼 있는지 확인 — 상세 조회 시 클라이언트가 임의의
  // groupId를 넘겨 무관한 그룹의 닉네임/프로필을 엿보지 못하게 막는 용도.
  async isSharedToGroup(postId: string, groupId: string): Promise<boolean> {
    const count = await this.postGroupShareRepository.count({
      where: { postId, groupId, deletedAt: IsNull() },
    });
    return count > 0;
  }
}
