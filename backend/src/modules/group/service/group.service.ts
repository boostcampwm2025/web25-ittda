// group.service.ts: 그룹의 핵심 기능(생성, 삭제, 수정, 목록 조회, 멤버 조회 유틸)
import {
  Injectable,
  InternalServerErrorException,
  BadRequestException,
  ForbiddenException,
  NotFoundException,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { Group } from '../entity/group.entity';
import { GroupMember } from '../entity/group_member.entity';
import { GroupRoleEnum } from '@/enums/group-role.enum';
import { User } from '../../user/entity/user.entity';
import { Post } from '@/modules/post/entity/post.entity';
import {
  PostMedia,
  PostMediaKind,
} from '@/modules/post/entity/post-media.entity';
import { PostScope } from '@/enums/post-scope.enum';
import { GetGroupsResponseDto, GroupItemDto } from '../dto/get-groups.dto';

const GROUP_NICKNAME_REGEX = /^[a-zA-Z0-9가-힣 ]+$/;

@Injectable()
export class GroupService {
  private readonly logger = new Logger(GroupService.name);

  constructor(
    @InjectRepository(Group)
    private readonly groupRepo: Repository<Group>,

    @InjectRepository(GroupMember)
    private readonly groupMemberRepo: Repository<GroupMember>,

    @InjectRepository(User)
    private readonly userRepo: Repository<User>,

    @InjectRepository(Post)
    private readonly postRepo: Repository<Post>,

    @InjectRepository(PostMedia)
    private readonly postMediaRepo: Repository<PostMedia>,

    private readonly dataSource: DataSource,
  ) {}

  /** 그룹 생성 + ADMIN 등록 (트랜잭션 적용) */
  async createGroup(ownerId: string, name: string): Promise<Group> {
    return await this.dataSource.transaction(async (manager) => {
      try {
        const group = manager.create(Group, {
          name,
          owner: { id: ownerId } as User,
        });
        const savedGroup = await manager.save(group);

        const owner = await manager.findOneOrFail(User, {
          where: { id: ownerId },
        });

        const ownerMember = manager.create(GroupMember, {
          group: savedGroup,
          user: { id: ownerId } as User,
          role: GroupRoleEnum.ADMIN,
          nicknameInGroup: this.validateGroupNickname(owner.nickname),
        });
        await manager.save(ownerMember);

        return savedGroup;
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
      } catch (error) {
        throw new InternalServerErrorException(
          '그룹 생성 중 오류가 발생했습니다.',
        );
      }
    });
  }

  /** 그룹 멤버 조회 (Guard 핵심) */
  async findMember(
    userId: string,
    groupId: string,
  ): Promise<GroupMember | null> {
    const member = await this.groupMemberRepo.findOne({
      where: {
        userId,
        groupId,
      },
      relations: ['group', 'user'],
    });
    if (!member || !member.user) return null;
    return member;
  }

  /** 그룹 삭제 (방장만 가능) */
  async deleteGroup(userId: string, groupId: string): Promise<void> {
    const group = await this.groupRepo.findOne({
      where: { id: groupId },
      relations: ['owner'],
    });

    if (!group) {
      throw new NotFoundException('존재하지 않는 그룹입니다.');
    }

    if (group.owner.id !== userId) {
      throw new ForbiddenException('그룹을 삭제할 권한이 없습니다.');
    }

    // TODO: 그룹 삭제 시 post_drafts는 CASCADE 대신 서비스 로직에서 정리(soft delete 고려).
    await this.groupRepo.remove(group);
  }

  /** 그룹 정보 수정 */
  async updateGroup(userId: string, groupId: string, name: string) {
    const group = await this.groupRepo.findOne({
      where: { id: groupId },
      relations: ['owner'],
    });

    if (!group) {
      throw new NotFoundException('존재하지 않는 그룹입니다.');
    }

    await this.groupRepo.update(groupId, { name });
  }

  /** 그룹 목록 조회 (최신 활동 순) - N+1 최적화 */
  async getGroups(userId: string): Promise<GetGroupsResponseDto> {
    const members = await this.groupMemberRepo
      .createQueryBuilder('gm')
      .innerJoin('gm.user', 'u')
      .select(['gm.groupId', 'gm.role'])
      .where('gm.userId = :userId', { userId })
      .andWhere('u.deletedAt IS NULL')
      .getMany();

    if (members.length === 0) {
      return { items: [] };
    }

    const groupIds = members.map((m) => m.groupId);
    const roleByGroupId = new Map(members.map((m) => [m.groupId, m.role]));
    if (groupIds.length > 0) {
      this.cleanupStaleGroupCovers(groupIds);
    }

    // 1. Batch: 그룹 정보 조회
    const groups = await this.groupRepo
      .createQueryBuilder('g')
      .leftJoinAndSelect('g.coverMedia', 'coverMedia')
      .whereInIds(groupIds)
      .cache(true)
      .getMany();

    const groupMap = new Map<string, Group>();
    for (const g of groups) {
      groupMap.set(g.id, g);
    }

    // 2. Batch: 그룹별 멤버 수 집계
    const memberCounts = await this.groupMemberRepo
      .createQueryBuilder('gm')
      .innerJoin('gm.user', 'u')
      .select('gm.groupId', 'groupId')
      .addSelect('COUNT(gm.id)', 'count')
      .where('gm.groupId IN (:...groupIds)', { groupIds })
      .andWhere('u.deletedAt IS NULL')
      .groupBy('gm.groupId')
      .getRawMany<{ groupId: string; count: string }>();

    const memberCountMap = new Map<string, number>();
    for (const row of memberCounts) {
      memberCountMap.set(row.groupId, parseInt(row.count, 10));
    }

    // 3. Batch: 그룹별 게시글 수 집계 (soft delete 제외)
    const recordCounts = await this.postRepo
      .createQueryBuilder('p')
      .select('p.groupId', 'groupId')
      .addSelect('COUNT(p.id)', 'count')
      .where('p.groupId IN (:...groupIds)', { groupIds })
      .andWhere('p.deletedAt IS NULL')
      .groupBy('p.groupId')
      .getRawMany<{ groupId: string; count: string }>();

    const recordCountMap = new Map<string, number>();
    for (const row of recordCounts) {
      recordCountMap.set(row.groupId, parseInt(row.count, 10));
    }

    // 4. Batch: 그룹별 최신 게시글 조회 (sub-select로 최신 1건 가져오기)
    // Simple approach: 모든 게시글 중 groupId 기준 최신 1개씩 (DISTINCT ON PostgreSQL)
    // 하지만 TypeORM에서 DISTINCT ON은 DB 종속적. 대안: 그룹별 최신 eventAt 조회 후 매핑.
    // 여기서는 단순화하여 조회 후 JS에서 첫 번째만 사용.
    const latestPosts = await this.postRepo
      .createQueryBuilder('p')
      .select(['p.id', 'p.groupId', 'p.title', 'p.eventAt', 'p.createdAt'])
      .where('p.groupId IN (:...groupIds)', { groupIds })
      .andWhere('p.deletedAt IS NULL')
      .orderBy('p.eventAt', 'DESC')
      .getMany();

    const latestPostMap = new Map<string, Post>();
    for (const post of latestPosts) {
      if (post.groupId && !latestPostMap.has(post.groupId)) {
        latestPostMap.set(post.groupId, post);
      }
    }

    // 5. 결과 조립
    const items: GroupItemDto[] = [];
    for (const groupId of groupIds) {
      const group = groupMap.get(groupId);
      if (!group) continue;

      const memberCount = memberCountMap.get(groupId) ?? 0;
      const recordCount = recordCountMap.get(groupId) ?? 0;
      const latestPost = latestPostMap.get(groupId) ?? null;
      const lastActivityAt = group.lastActivityAt || group.createdAt;

      items.push({
        groupId: group.id,
        name: group.name,
        cover:
          group.coverMedia && !group.coverMedia.deletedAt
            ? {
                assetId: group.coverMedia.id,
                width: group.coverMedia.width ?? 0,
                height: group.coverMedia.height ?? 0,
                mimeType:
                  group.coverMedia.mimeType ?? 'application/octet-stream',
              }
            : null,
        memberCount,
        recordCount,
        createdAt: group.createdAt,
        lastActivityAt,
        latestPost: latestPost
          ? {
              postId: latestPost.id,
              title: latestPost.title,
              eventAt: latestPost.eventAt || latestPost.createdAt,
              placeName: null,
            }
          : null,
        permission: roleByGroupId.get(groupId) ?? null,
      });
    }

    items.sort((a, b) => {
      const timeA = a.lastActivityAt ? new Date(a.lastActivityAt).getTime() : 0;
      const timeB = b.lastActivityAt ? new Date(b.lastActivityAt).getTime() : 0;
      return timeB - timeA;
    });

    return { items };
  }

  private async resolveGroupCover(group: Group) {
    if (group.coverMedia) {
      return {
        assetId: group.coverMedia.id,
        width: group.coverMedia.width,
        height: group.coverMedia.height,
        mimeType: group.coverMedia.mimeType,
      };
    }

    const latestMedia = await this.postMediaRepo
      .createQueryBuilder('pm')
      .innerJoin('pm.post', 'post')
      .leftJoinAndSelect('pm.media', 'media')
      .where('post.groupId = :groupId', { groupId: group.id })
      .andWhere('post.deletedAt IS NULL')
      .andWhere('post.scope = :scope', { scope: PostScope.GROUP })
      .andWhere('pm.kind = :kind', { kind: PostMediaKind.BLOCK })
      .orderBy('post.eventAt', 'DESC')
      .addOrderBy('post.createdAt', 'DESC')
      .addOrderBy('pm.sortOrder', 'ASC')
      .addOrderBy('pm.createdAt', 'ASC')
      .getOne();

    if (!latestMedia?.media) {
      return null;
    }

    return {
      assetId: latestMedia.media.id,
      width: latestMedia.media.width,
      height: latestMedia.media.height,
      mimeType: latestMedia.media.mimeType,
    };
  }

  private validateGroupNickname(nickname: string): string {
    const trimmed = nickname.trim();
    if (trimmed.length < 2 || trimmed.length > 50) {
      throw new BadRequestException(
        '닉네임은 2자 이상 50자 이하이어야 합니다.',
      );
    }
    if (!GROUP_NICKNAME_REGEX.test(trimmed)) {
      throw new BadRequestException(
        '닉네임은 한글, 영문, 숫자, 공백만 허용됩니다.',
      );
    }
    return trimmed;
  }

  private cleanupStaleGroupCovers(groupIds: string[]) {
    void this.groupRepo
      .createQueryBuilder()
      .update()
      .set({ coverMediaId: null, coverSourcePostId: null })
      .where('id IN (:...groupIds)', { groupIds })
      .andWhere(
        '("cover_media_id" IN (SELECT id FROM media_assets WHERE deleted_at IS NOT NULL) OR "cover_source_post_id" IN (SELECT id FROM posts WHERE deleted_at IS NOT NULL))',
      )
      .execute()
      .catch((error) => {
        const message =
          error instanceof Error ? error.message : 'unknown error';
        this.logger.warn(`Failed to cleanup stale group covers: ${message}`);
      });
  }
}
