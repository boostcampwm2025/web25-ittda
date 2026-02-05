import {
  Injectable,
  Logger,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
  UnauthorizedException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, IsNull, Repository } from 'typeorm';
import type { Point } from 'geojson';

import { Post } from './entity/post.entity';
import { PostBlock } from './entity/post-block.entity';
import { PostContributor } from './entity/post-contributor.entity';
import { PostDraft } from './entity/post-draft.entity';
import { PostMedia, PostMediaKind } from './entity/post-media.entity';
import { User } from '@/modules/user/entity/user.entity';
import { Group } from '@/modules/group/entity/group.entity';
import { GroupMonthCover } from '@/modules/group/entity/group-month-cover.entity';
import { GroupMember } from '@/modules/group/entity/group_member.entity';
import { UserMonthCover } from '@/modules/user/entity/user-month-cover.entity';
import { CreatePostDto } from './dto/create-post.dto';
import { EditPostDto } from './dto/edit-post.dto';
import { PostDetailDto } from './dto/post-detail.dto';
import { PostScope } from '@/enums/post-scope.enum';
import { PostBlockType } from '@/enums/post-block-type.enum';
import { GroupRoleEnum } from '@/enums/group-role.enum';
import { PostContributorRole } from '@/enums/post-contributor-role.enum';
import { validateBlocks } from './validator/blocks.validator';
import { validateBlockValues } from './validator/block-values.validator';
import { validatePostTitle } from './validator/post-title.validator';
import { BlockValueMap } from './types/post-block.types';
import { extractMetaFromBlocks } from './validator/meta.extractor';
import { resolveEventAtFromBlocks } from './validator/event-at.resolver';
import { PresenceService } from './collab/presence.service';
import { GroupActivityService } from '@/modules/group/service/group-activity.service';
import { GroupActivityType } from '@/enums/group-activity-type.enum';

@Injectable()
export class PostService {
  private readonly logger = new Logger(PostService.name);

  constructor(
    @InjectRepository(Post)
    private readonly postRepository: Repository<Post>,
    @InjectRepository(PostBlock)
    private readonly postBlockRepository: Repository<PostBlock>,
    @InjectRepository(PostContributor)
    private readonly postContributorRepository: Repository<PostContributor>,
    @InjectRepository(PostDraft)
    private readonly postDraftRepository: Repository<PostDraft>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(Group)
    private readonly groupRepository: Repository<Group>,
    @InjectRepository(GroupMember)
    private readonly groupMemberRepository: Repository<GroupMember>,
    private readonly presenceService: PresenceService,
    private readonly groupActivityService: GroupActivityService,
  ) {}

  /**
   * 게시글 생성: 블록 검증 → 메타 추출 → eventAt 생성 후,
   * Post/Contributor/Block을 트랜잭션으로 저장한다.
   */
  async createPost(ownerUserId: string, dto: CreatePostDto) {
    // 블록 검증 → 메타 추출 → eventAt 생성 순서로 선행 처리
    validatePostTitle(dto.title);
    validateBlocks(dto.blocks);
    validateBlockValues(dto.blocks);

    const owner = await this.userRepository.findOne({
      where: { id: ownerUserId },
    });
    if (!owner) throw new UnauthorizedException('Owner not found');

    if (dto.scope === PostScope.GROUP && dto.groupId) {
      const activeDraft = await this.postDraftRepository.findOne({
        where: { groupId: dto.groupId, isActive: true },
        select: { id: true },
      });
      if (activeDraft) {
        const member = this.presenceService.getMemberByActor(
          activeDraft.id,
          ownerUserId,
        );
        if (member) {
          throw new ConflictException(
            'Draft participant must publish via draft.',
          );
        }
      }
    }

    if (dto.scope === PostScope.GROUP && !dto.groupId) {
      throw new BadRequestException('groupId is required when scope=GROUP');
    }
    if (dto.scope === PostScope.PERSONAL && dto.groupId) {
      throw new BadRequestException(
        'groupId must be omitted when scope=PERSONAL',
      );
    }

    let group: Group | null = null;
    if (dto.groupId) {
      group = await this.groupRepository.findOne({
        where: { id: dto.groupId },
      });
      if (!group) throw new NotFoundException('Group not found');
    }
    if (dto.scope === PostScope.GROUP && dto.groupId) {
      const member = await this.groupMemberRepository.findOne({
        where: { groupId: dto.groupId, userId: ownerUserId },
        select: { role: true },
      });
      if (!member) {
        throw new ForbiddenException('Not a group member.');
      }
      if (member.role === GroupRoleEnum.VIEWER) {
        throw new ForbiddenException('Insufficient permission.');
      }
    }

    const meta = extractMetaFromBlocks(dto.blocks);
    const eventAt = resolveEventAtFromBlocks(meta.date, meta.time); // 세번째 인자는 옵션: timezoneOffset

    const location: Point | undefined = meta.location
      ? {
          type: 'Point',
          coordinates: [meta.location.lng, meta.location.lat],
        }
      : undefined;

    // Post와 PostBlock을 트랜잭션으로 원자적 저장
    const postId = await this.postRepository.manager.transaction(
      async (manager) => {
        const postRepo = manager.getRepository(Post);
        const blockRepo = manager.getRepository(PostBlock);
        const contributorRepo = manager.getRepository(PostContributor);
        const mediaRepo = manager.getRepository(PostMedia);
        const groupRepo = manager.getRepository(Group);

        const post = postRepo.create({
          scope: dto.scope,
          ownerUserId,
          ownerUser: owner,
          groupId: dto.scope === PostScope.GROUP ? (dto.groupId ?? null) : null,
          group: dto.scope === PostScope.GROUP ? group : null,
          title: dto.title,
          location: location ?? undefined,
          eventAt,
          tags: meta.tags ?? null,
          emotion: meta.emotion ?? null,
          rating: meta.rating ?? null,
        });

        const saved = await postRepo.save(post);

        if (saved.groupId) {
          await groupRepo.update(saved.groupId, {
            lastActivityAt: saved.updatedAt,
          });
        }

        const contributor = contributorRepo.create({
          postId: saved.id,
          post: saved,
          userId: ownerUserId,
          user: owner,
          role: PostContributorRole.AUTHOR,
        });
        await contributorRepo.save(contributor);

        const blocks = dto.blocks.map((b) =>
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

        const mediaEntries: PostMedia[] = [];
        if (dto.thumbnailMediaId) {
          mediaEntries.push(
            mediaRepo.create({
              postId: saved.id,
              post: saved,
              mediaId: dto.thumbnailMediaId,
              kind: PostMediaKind.THUMBNAIL,
            }),
          );
        }

        if (blocks.length > 0) {
          const savedBlocks = await blockRepo.save(blocks);

          savedBlocks.forEach((savedBlock, index) => {
            if (savedBlock.type !== PostBlockType.IMAGE) return;
            const inputBlock = dto.blocks[index];
            if (!inputBlock || inputBlock.type !== PostBlockType.IMAGE) return;
            const mediaIds = (inputBlock.value as BlockValueMap['IMAGE'])
              ?.mediaIds;
            if (!Array.isArray(mediaIds) || mediaIds.length === 0) return;
            mediaIds.forEach((mediaId, sortIndex) => {
              if (typeof mediaId !== 'string') return;
              mediaEntries.push(
                mediaRepo.create({
                  postId: saved.id,
                  post: saved,
                  mediaId,
                  kind: PostMediaKind.BLOCK,
                  blockId: savedBlock.id,
                  block: savedBlock,
                  sortOrder: sortIndex + 1,
                }),
              );
            });
          });
        }

        if (mediaEntries.length > 0) {
          await mediaRepo.save(mediaEntries);
        }

        return saved.id;
      },
    );

    if (dto.scope === PostScope.GROUP && dto.groupId) {
      await this.groupActivityService.recordActivity({
        groupId: dto.groupId,
        type: GroupActivityType.POST_CREATE,
        actorIds: [ownerUserId],
        refId: postId,
        meta: { title: dto.title },
      });
    }

    return this.findOne(postId, ownerUserId);
  }

  /**
   * 게시글 상세 조회: Post 기본 정보에 블록과 기여자 정보를 합쳐 반환한다.
   */
  async findOne(postId: string, requesterId: string) {
    const post = await this.postRepository.findOne({
      where: { id: postId, deletedAt: IsNull() },
      relations: ['ownerUser', 'group'],
    });
    if (!post) throw new NotFoundException('Post not found');
    const blocks = await this.postBlockRepository.find({
      where: { postId },
      order: { layoutRow: 'ASC', layoutCol: 'ASC', layoutSpan: 'ASC' },
    });
    const contributors = await this.postContributorRepository.find({
      where: { postId },
      relations: ['user'],
    });
    const activeContributors = contributors.filter(
      (contributor): contributor is PostContributor & { user: User } =>
        Boolean(contributor.user),
    );
    const groupMemberMap = new Map<
      string,
      { nicknameInGroup?: string | null; profileMediaId?: string | null }
    >();
    if (post.scope === PostScope.GROUP && post.groupId) {
      const members = await this.groupMemberRepository.find({
        where: activeContributors.map((c) => ({
          groupId: post.groupId as string,
          userId: c.userId,
        })),
        select: ['userId', 'nicknameInGroup', 'profileMediaId'],
      });
      members.forEach((member) => {
        groupMemberMap.set(member.userId, {
          nicknameInGroup: member.nicknameInGroup ?? null,
          profileMediaId: member.profileMediaId ?? null,
        });
      });
    }

    const contributorDtos = activeContributors.map((c) => {
      const groupMember = groupMemberMap.get(c.userId);
      return {
        userId: c.userId,
        role: c.role,
        nickname: c.user.nickname ?? null,
        groupNickname: groupMember?.nicknameInGroup ?? null,
        profileImageId: c.user.profileImageId ?? null,
        groupProfileImageId: groupMember?.profileMediaId ?? null,
      };
    });

    const isOwner = post.ownerUserId === requesterId;
    let permission: 'ADMIN' | 'EDITOR' | 'VIEWER' | 'OWNER' | null = null;

    if (post.scope === PostScope.GROUP && post.groupId) {
      const member = await this.groupMemberRepository.findOne({
        where: { groupId: post.groupId, userId: requesterId },
        select: { role: true },
      });
      permission = member?.role ?? null;
    } else {
      permission = isOwner ? 'OWNER' : null;
    }

    let hasActiveEditDraft: boolean | undefined;
    if (post.scope === PostScope.GROUP && post.groupId) {
      const activeEditDraft = await this.postDraftRepository.findOne({
        where: {
          groupId: post.groupId,
          targetPostId: postId,
          kind: 'EDIT',
          isActive: true,
        },
        select: { id: true },
      });
      hasActiveEditDraft = Boolean(activeEditDraft);
    }

    const dto: PostDetailDto = {
      id: post.id,
      scope: post.scope,
      ownerUserId: post.ownerUserId,
      groupId: post.groupId ?? null,
      title: post.title,
      createdAt: post.createdAt,
      updatedAt: post.updatedAt,
      blocks: blocks.map((b) => ({
        id: b.id,
        type: b.type,
        value: b.value,
        layout: {
          row: b.layoutRow,
          col: b.layoutCol,
          span: b.layoutSpan,
        },
      })),
      contributors: contributorDtos,
      permission,
      hasActiveEditDraft,
    };
    return dto;
  }

  async ensureCanViewPost(postId: string, userId: string): Promise<void> {
    // 본인 글이면 통과
    const post = await this.postRepository.findOne({
      where: { id: postId, deletedAt: IsNull() },
      select: { id: true, ownerUserId: true, groupId: true, scope: true },
    });
    if (!post) throw new NotFoundException('Post not found');
    if (post.ownerUserId === userId) return;

    // 내 그룹 글이면 통과
    if (post.scope === PostScope.GROUP && post.groupId) {
      const member = await this.groupMemberRepository.findOne({
        where: { groupId: post.groupId, userId },
        select: { userId: true },
      });
      if (member) return;
    }

    // 기여자면 통과
    const contributor = await this.postContributorRepository.findOne({
      where: { postId, userId },
      select: { userId: true },
    });
    if (!contributor) {
      throw new ForbiddenException('You do not have access to this post');
    }
  }

  async getEditSnapshot(postId: string, userId: string): Promise<EditPostDto> {
    const post = await this.getPostForEdit(postId, userId);
    const blocks = await this.postBlockRepository.find({
      where: { postId },
      order: { layoutRow: 'ASC', layoutCol: 'ASC', layoutSpan: 'ASC' },
    });

    const snapshot: EditPostDto = {
      title: post.title,
      blocks: blocks.map((b) => ({
        id: b.id,
        type: b.type,
        value: b.value,
        layout: {
          row: b.layoutRow,
          col: b.layoutCol,
          span: b.layoutSpan,
        },
      })),
    };

    return snapshot;
  }

  /**
   * 게시글 수정: 블록 검증 → 메타 추출 → eventAt 생성 후,
   * Post/Block을 트랜잭션으로 갱신한다.
   */
  async updatePost(
    postId: string,
    requesterId: string,
    dto: EditPostDto,
  ): Promise<PostDetailDto> {
    const post = await this.getPostForEdit(postId, requesterId);
    const beforeTitle = post.title;
    const groupId = post.groupId ?? null;
    if (post.scope === PostScope.GROUP && post.groupId) {
      const member = await this.groupMemberRepository.findOne({
        where: { groupId: post.groupId, userId: requesterId },
        select: { role: true },
      });
      if (!member) {
        throw new ForbiddenException('Not a group member.');
      }
      if (member.role === GroupRoleEnum.VIEWER) {
        throw new ForbiddenException('Insufficient permission.');
      }
    }

    validatePostTitle(dto.title);
    validateBlocks(dto.blocks);
    validateBlockValues(dto.blocks);
    this.ensureNoDuplicateBlockIds(dto.blocks);

    const meta = extractMetaFromBlocks(dto.blocks);
    const eventAt = resolveEventAtFromBlocks(meta.date, meta.time);

    const location: Point | undefined = meta.location
      ? {
          type: 'Point',
          coordinates: [meta.location.lng, meta.location.lat],
        }
      : undefined;

    await this.postRepository.manager.transaction(async (manager) => {
      const postRepo = manager.getRepository(Post);
      const blockRepo = manager.getRepository(PostBlock);
      const contributorRepo = manager.getRepository(PostContributor);
      const groupRepo = manager.getRepository(Group);

      const existingBlocks = await blockRepo.find({
        where: { postId: post.id },
        select: { id: true },
      });
      const existingIds = new Set(existingBlocks.map((block) => block.id));
      const nextIds = new Set(
        dto.blocks.map((block) => block.id).filter(Boolean),
      );
      const deleteIds = Array.from(existingIds).filter(
        (id) => !nextIds.has(id),
      );

      const updated = postRepo.create({
        ...post,
        title: dto.title,
        location: location ?? undefined,
        eventAt,
        tags: meta.tags ?? null,
        emotion: meta.emotion ?? null,
        rating: meta.rating ?? null,
      });
      const saved = await postRepo.save(updated);

      if (deleteIds.length > 0) {
        await blockRepo.delete({ id: In(deleteIds) });
      }
      const blocks = dto.blocks.map((b) =>
        blockRepo.create({
          id: b.id,
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

      if (requesterId !== post.ownerUserId) {
        const existingContributor = await contributorRepo.findOne({
          where: { postId: post.id, userId: requesterId },
          select: { role: true },
        });
        if (!existingContributor) {
          const contributor = contributorRepo.create({
            postId: post.id,
            userId: requesterId,
            role: PostContributorRole.EDITOR,
          });
          await contributorRepo.save(contributor);
        }
      }

      if (saved.groupId) {
        await groupRepo.update(saved.groupId, {
          lastActivityAt: saved.updatedAt,
        });
      }
    });

    if (post.scope === PostScope.GROUP && groupId) {
      const meta =
        beforeTitle !== dto.title
          ? { beforeTitle, afterTitle: dto.title }
          : null;
      await this.groupActivityService.recordActivity({
        groupId,
        type: GroupActivityType.POST_UPDATE,
        actorIds: [requesterId],
        refId: postId,
        meta,
      });
    }

    return this.findOne(postId, requesterId);
  }

  /**
   * 게시글 삭제: 작성자만 삭제 가능, soft delete 처리.
   */
  async deletePost(postId: string, requesterId: string): Promise<void> {
    const post = await this.postRepository.findOne({
      where: { id: postId, deletedAt: IsNull() },
    });
    if (!post) throw new NotFoundException('Post not found');
    if (post.scope === PostScope.GROUP && post.groupId) {
      const member = await this.groupMemberRepository.findOne({
        where: { groupId: post.groupId, userId: requesterId },
        select: { role: true },
      });
      if (!member) {
        throw new ForbiddenException('Not a group member.');
      }
      if (member.role === GroupRoleEnum.VIEWER) {
        throw new ForbiddenException('Insufficient permission.');
      }
      const isAdmin = member.role === GroupRoleEnum.ADMIN;
      const isOwner = post.ownerUserId === requesterId;
      if (!isAdmin && !isOwner) {
        throw new ForbiddenException(
          'Only the owner or admin can delete this post',
        );
      }
    } else if (post.ownerUserId !== requesterId) {
      throw new ForbiddenException('Only the owner can delete this post');
    }
    await this.postRepository.softDelete(postId);

    void this.cleanupCoversForDeletedPost(
      postId,
      post.ownerUserId,
      post.groupId,
    );

    if (post.groupId) {
      const latest = await this.postRepository.findOne({
        where: { groupId: post.groupId, deletedAt: IsNull() },
        order: { updatedAt: 'DESC' },
        select: { updatedAt: true },
      });
      await this.groupRepository.update(post.groupId, {
        lastActivityAt: latest?.updatedAt ?? null,
      });

      await this.groupActivityService.recordActivity({
        groupId: post.groupId,
        type: GroupActivityType.POST_DELETE,
        actorIds: [requesterId],
        refId: postId,
        meta: { title: post.title },
      });
    }
  }

  private async cleanupCoversForDeletedPost(
    postId: string,
    ownerUserId: string,
    groupId?: string | null,
  ) {
    try {
      const postMediaRepo =
        this.postRepository.manager.getRepository(PostMedia);
      const groupMonthCoverRepo =
        this.groupRepository.manager.getRepository(GroupMonthCover);
      const userMonthCoverRepo =
        this.userRepository.manager.getRepository(UserMonthCover);

      const mediaRows = await postMediaRepo.find({
        where: { postId, kind: PostMediaKind.BLOCK },
        select: { mediaId: true },
      });
      const mediaIds = Array.from(
        new Set(mediaRows.map((row) => row.mediaId).filter(Boolean)),
      );

      const updateTasks: Array<Promise<unknown>> = [];

      if (mediaIds.length > 0 && groupId) {
        updateTasks.push(
          this.groupRepository
            .createQueryBuilder()
            .update()
            .set({ coverMediaId: null, coverSourcePostId: null })
            .where('id = :groupId', { groupId })
            .andWhere('coverMediaId IN (:...mediaIds)', { mediaIds })
            .execute(),
          groupMonthCoverRepo
            .createQueryBuilder()
            .update()
            .set({ coverAssetId: null, sourcePostId: null })
            .where('groupId = :groupId', { groupId })
            .andWhere('coverAssetId IN (:...mediaIds)', { mediaIds })
            .execute(),
        );
      }

      if (mediaIds.length > 0) {
        updateTasks.push(
          userMonthCoverRepo
            .createQueryBuilder()
            .update()
            .set({ coverAssetId: null })
            .where('userId = :userId', { userId: ownerUserId })
            .andWhere('coverAssetId IN (:...mediaIds)', { mediaIds })
            .execute(),
        );
      }

      if (groupId) {
        updateTasks.push(
          this.groupRepository
            .createQueryBuilder()
            .update()
            .set({ coverMediaId: null, coverSourcePostId: null })
            .where('id = :groupId', { groupId })
            .andWhere('coverSourcePostId = :postId', { postId })
            .execute(),
          groupMonthCoverRepo
            .createQueryBuilder()
            .update()
            .set({ coverAssetId: null, sourcePostId: null })
            .where('groupId = :groupId', { groupId })
            .andWhere('sourcePostId = :postId', { postId })
            .execute(),
        );
      }

      await Promise.all(updateTasks);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'unknown error';
      this.logger.warn(
        `Failed to cleanup covers (groupId=${groupId ?? 'N/A'}, postId=${postId}): ${message}`,
      );
    }
  }

  private async getPostForEdit(postId: string, userId: string) {
    const post = await this.postRepository.findOne({
      where: { id: postId, deletedAt: IsNull() },
      select: {
        id: true,
        ownerUserId: true,
        groupId: true,
        scope: true,
        title: true,
      },
    });
    if (!post) throw new NotFoundException('Post not found');
    if (post.ownerUserId === userId) return post;

    if (post.scope === PostScope.GROUP && post.groupId) {
      const member = await this.groupMemberRepository.findOne({
        where: { groupId: post.groupId, userId },
        select: { role: true },
      });
      if (
        member &&
        (member.role === GroupRoleEnum.ADMIN ||
          member.role === GroupRoleEnum.EDITOR)
      ) {
        return post;
      }
      throw new ForbiddenException('You do not have access to edit this post');
    }

    const contributor = await this.postContributorRepository.findOne({
      where: { postId, userId },
      select: { role: true },
    });
    if (
      !contributor ||
      (contributor.role !== PostContributorRole.AUTHOR &&
        contributor.role !== PostContributorRole.EDITOR)
    ) {
      throw new ForbiddenException('You do not have access to edit this post');
    }
    return post;
  }

  private ensureNoDuplicateBlockIds(blocks: EditPostDto['blocks']) {
    const ids = blocks.map((block) => block.id).filter(Boolean);
    if (ids.length === 0) return;
    const unique = new Set(ids);
    if (unique.size !== ids.length) {
      throw new BadRequestException('Duplicate blockId in blocks.');
    }
  }
}
