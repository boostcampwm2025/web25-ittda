import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
  UnauthorizedException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { IsNull, Repository } from 'typeorm';
import type { Point } from 'geojson';

import { Post } from './entity/post.entity';
import { PostBlock } from './entity/post-block.entity';
import { PostContributor } from './entity/post-contributor.entity';
import { PostMedia, PostMediaKind } from './entity/post-media.entity';
import { PostDraft } from './entity/post-draft.entity';
import { User } from '@/modules/user/entity/user.entity';
import { Group } from '@/modules/group/entity/group.entity';
import { GroupMember } from '@/modules/group/entity/group_member.entity';
import { CreatePostDto } from './dto/create-post.dto';
import { PostDetailDto } from './dto/post-detail.dto';
import { PostScope } from '@/enums/post-scope.enum';
import { PostBlockType } from '@/enums/post-block-type.enum';
import { PostContributorRole } from '@/enums/post-contributor-role.enum';
import { validateBlocks } from './validator/blocks.validator';
import { BlockValueMap } from './types/post-block.types';
import { extractMetaFromBlocks } from './validator/meta.extractor';
import { resolveEventAtFromBlocks } from './validator/event-at.resolver';
import { PresenceService } from './collab/presence.service';

@Injectable()
export class PostService {
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
  ) {}

  /**
   * 게시글 생성: 블록 검증 → 메타 추출 → eventAt 생성 후,
   * Post/Contributor/Block을 트랜잭션으로 저장한다.
   */
  async createPost(ownerUserId: string, dto: CreatePostDto) {
    // 블록 검증 → 메타 추출 → eventAt 생성 순서로 선행 처리
    validateBlocks(dto.blocks);

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

    return this.findOne(postId);
  }

  /**
   * 게시글 상세 조회: Post 기본 정보에 블록과 기여자 정보를 합쳐 반환한다.
   */
  async findOne(postId: string) {
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
    const contributorDtos = contributors.map((c) => ({
      userId: c.userId,
      role: c.role,
      nickname: c.user?.nickname,
    }));

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

  /**
   * 게시글 삭제: 작성자만 삭제 가능, soft delete 처리.
   */
  async deletePost(postId: string, requesterId: string): Promise<void> {
    const post = await this.postRepository.findOne({
      where: { id: postId, deletedAt: IsNull() },
    });
    if (!post) throw new NotFoundException('Post not found');
    if (post.ownerUserId !== requesterId) {
      throw new ForbiddenException('Only the owner can delete this post');
    }
    await this.postRepository.softDelete(postId);

    if (post.groupId) {
      const latest = await this.postRepository.findOne({
        where: { groupId: post.groupId, deletedAt: IsNull() },
        order: { updatedAt: 'DESC' },
        select: { updatedAt: true },
      });
      await this.groupRepository.update(post.groupId, {
        lastActivityAt: latest?.updatedAt ?? null,
      });
    }
  }
}
