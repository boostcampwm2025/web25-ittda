import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, IsNull, QueryFailedError, Repository } from 'typeorm';
import type { Point } from 'geojson';
import { isUUID } from 'class-validator';

import { PostDraft } from './entity/post-draft.entity';
import { PostDraftMedia } from './entity/post-draft-media.entity';
import { Post } from './entity/post.entity';
import { PostBlock } from './entity/post-block.entity';
import { PostContributor } from './entity/post-contributor.entity';
import { PostMedia, PostMediaKind } from './entity/post-media.entity';
import { User } from '@/modules/user/entity/user.entity';
import { Group } from '@/modules/group/entity/group.entity';
import { GroupMember } from '@/modules/group/entity/group_member.entity';
import { DraftStateService } from './collab/draft-state.service';
import { PostDraftGateway } from './post-draft.gateway';
import { PublishDraftDto } from './dto/publish-draft.dto';
import { PostScope } from '@/enums/post-scope.enum';
import { GroupRoleEnum } from '@/enums/group-role.enum';
import { PostContributorRole } from '@/enums/post-contributor-role.enum';
import { PostBlockType } from '@/enums/post-block-type.enum';
import { CreatePostDto } from './dto/create-post.dto';
import { validateBlocks } from './validator/blocks.validator';
import { validateBlockValues } from './validator/block-values.validator';
import { validatePostTitle } from './validator/post-title.validator';
import { BlockValueMap } from './types/post-block.types';
import { extractMetaFromBlocks } from './validator/meta.extractor';
import { resolveEventAtFromBlocks } from './validator/event-at.resolver';

@Injectable()
export class PostPublishService {
  private readonly logger = new Logger(PostPublishService.name);

  constructor(
    @InjectRepository(Post)
    private readonly postRepository: Repository<Post>,
    private readonly draftStateService: DraftStateService,
    private readonly postDraftGateway: PostDraftGateway,
  ) {}

  async publishGroupDraft(
    requesterId: string,
    groupId: string,
    payload: PublishDraftDto,
  ) {
    const { draftId, draftVersion } = payload;
    if (!this.draftStateService.startPublishing(draftId)) {
      throw new ConflictException('Draft is already publishing.');
    }
    this.postDraftGateway.broadcastDraftPublishStarted(draftId);

    try {
      const postId = await this.postRepository.manager.transaction(
        async (manager) => {
          const draftRepo = manager.getRepository(PostDraft);
          const draftMediaRepo = manager.getRepository(PostDraftMedia);
          const postRepo = manager.getRepository(Post);
          const blockRepo = manager.getRepository(PostBlock);
          const contributorRepo = manager.getRepository(PostContributor);
          const mediaRepo = manager.getRepository(PostMedia);
          const groupRepo = manager.getRepository(Group);
          const memberRepo = manager.getRepository(GroupMember);
          const userRepo = manager.getRepository(User);

          const draft = await draftRepo.findOne({
            where: { id: draftId, groupId: groupId, isActive: true },
            lock: { mode: 'pessimistic_write' },
          });
          if (!draft) throw new NotFoundException('Draft not found');
          if (draft.version !== draftVersion) {
            throw new ConflictException('Draft version mismatch.');
          }

          const member = await memberRepo.findOne({
            where: { groupId: groupId, userId: requesterId },
            select: { role: true },
          });
          if (!member) {
            throw new ForbiddenException('Not a group member.');
          }
          if (member.role === GroupRoleEnum.VIEWER) {
            throw new ForbiddenException('Insufficient permission.');
          }

          const owner = await userRepo.findOne({
            where: { id: draft.ownerActorId },
          });
          if (!owner) {
            throw new UnauthorizedException('Owner not found.');
          }

          const group = await groupRepo.findOne({
            where: { id: groupId },
          });
          if (!group) throw new NotFoundException('Group not found');

          const snapshot = this.parseGroupDraftSnapshot(
            draft.snapshot,
            groupId,
          );

          const snapshotBlocks = snapshot.blocks;
          validatePostTitle(snapshot.title);
          validateBlocks(snapshotBlocks, {
            layoutErrorMessage: 'Layout is invalid.',
          });
          validateBlockValues(snapshotBlocks);
          this.ensureBlockIds(snapshotBlocks);
          this.ensureNoDuplicateBlockIds(snapshotBlocks);

          const meta = extractMetaFromBlocks(snapshotBlocks);
          const eventAt = resolveEventAtFromBlocks(meta.date, meta.time);
          const location: Point | undefined = meta.location
            ? {
                type: 'Point',
                coordinates: [meta.location.lng, meta.location.lat],
              }
            : undefined;

          const created = postRepo.create({
            scope: PostScope.GROUP,
            ownerUserId: draft.ownerActorId,
            ownerUser: owner,
            groupId: groupId,
            group,
            title: snapshot.title,
            location: location ?? undefined,
            eventAt,
            tags: meta.tags ?? null,
            emotion: meta.emotion ?? null,
            rating: meta.rating ?? null,
          });
          const saved = await postRepo.save(created);

          const touchedBy = this.draftStateService.getTouchedBy(draftId);
          const contributorIds = Array.from(
            new Set([draft.ownerActorId, ...touchedBy]),
          );
          if (contributorIds.length > 0) {
            const contributors = contributorIds.map((userId) =>
              contributorRepo.create({
                postId: saved.id,
                post: saved,
                userId,
                role: PostContributorRole.AUTHOR,
              }),
            );
            await contributorRepo.save(contributors);
          }

          const savedBlocks = snapshotBlocks.map((block) =>
            blockRepo.create({
              id: block.id,
              postId: saved.id,
              post: saved,
              type: block.type,
              value: block.value,
              layoutRow: block.layout.row,
              layoutCol: block.layout.col,
              layoutSpan: block.layout.span,
            }),
          );
          if (savedBlocks.length > 0) {
            await blockRepo.save(savedBlocks);
          }

          const mediaEntries = this.buildBlockMediaEntries(
            mediaRepo,
            snapshotBlocks,
            saved.id,
            saved,
          );
          if (mediaEntries.length > 0) {
            await mediaRepo.save(mediaEntries);
          }

          draft.isActive = false;
          await draftRepo.save(draft);
          await draftMediaRepo.delete({ draftId: draft.id });

          return saved.id;
        },
      );

      this.draftStateService.clearTouchedBy(draftId);
      this.updateGroupLastActivity(groupId, postId);
      this.postDraftGateway.broadcastDraftPublished(draftId, postId);
      return postId;
    } catch (error) {
      const currentVersion = await this.getDraftCurrentVersion(draftId);
      this.postDraftGateway.broadcastDraftPublishEnded(
        draftId,
        currentVersion ?? undefined,
      );
      if (error instanceof QueryFailedError) {
        const dbError = error as { code?: string };
        if (dbError.code === '23505') {
          throw new ConflictException('Duplicate blockId.');
        }
      }
      throw error;
    } finally {
      this.draftStateService.finishPublishing(draftId);
    }
  }

  async publishGroupEditDraft(
    requesterId: string,
    groupId: string,
    postId: string,
    payload: PublishDraftDto,
  ) {
    const { draftId, draftVersion } = payload;
    if (!this.draftStateService.startPublishing(draftId)) {
      throw new ConflictException('Draft is already publishing.');
    }

    try {
      await this.postRepository.manager.transaction(async (manager) => {
        const draftRepo = manager.getRepository(PostDraft);
        const postRepo = manager.getRepository(Post);
        const blockRepo = manager.getRepository(PostBlock);
        const contributorRepo = manager.getRepository(PostContributor);
        const mediaRepo = manager.getRepository(PostMedia);
        const memberRepo = manager.getRepository(GroupMember);

        const draft = await draftRepo.findOne({
          where: {
            id: draftId,
            groupId,
            isActive: true,
            kind: 'EDIT',
            targetPostId: postId,
          },
          lock: { mode: 'pessimistic_write' },
        });
        if (!draft) throw new NotFoundException('Draft not found');
        if (draft.version !== draftVersion) {
          throw new ConflictException('Draft version mismatch.');
        }

        const post = await postRepo.findOne({
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

        // NOTE: edit publish는 snapshot에 groupId를 받기 때문에
        // 클라이언트 오염 방지를 위해 groupId 일치 검사를 유지한다.
        if (post.scope !== PostScope.GROUP || post.groupId !== groupId) {
          throw new BadRequestException('Post does not belong to this group.');
        }

        const member = await memberRepo.findOne({
          where: { groupId, userId: requesterId },
          select: { role: true },
        });
        if (!member) {
          throw new ForbiddenException('Not a group member.');
        }
        if (member.role === GroupRoleEnum.VIEWER) {
          throw new ForbiddenException('Insufficient permission.');
        }

        const snapshot = this.parseGroupDraftSnapshot(draft.snapshot, groupId);

        validatePostTitle(snapshot.title);
        const blocks = snapshot.blocks;
        validateBlocks(blocks, {
          layoutErrorMessage: 'Layout is invalid.',
        });
        validateBlockValues(blocks);
        this.ensureBlockIds(blocks);
        this.ensureNoDuplicateBlockIds(blocks);

        const meta = extractMetaFromBlocks(blocks);
        const eventAt = resolveEventAtFromBlocks(meta.date, meta.time);
        const location: Point | undefined = meta.location
          ? {
              type: 'Point',
              coordinates: [meta.location.lng, meta.location.lat],
            }
          : undefined;

        const existingBlocks = await blockRepo.find({
          where: { postId: post.id },
          select: { id: true },
        });
        const existingIds = new Set(existingBlocks.map((block) => block.id));
        const nextIds = new Set(
          blocks.map((block) => block.id).filter(Boolean),
        );
        const deleteIds = Array.from(existingIds).filter(
          (id) => !nextIds.has(id),
        );

        const updated = postRepo.create({
          ...post,
          title: snapshot.title,
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
        const updatedBlocks = blocks.map((block) =>
          blockRepo.create({
            id: block.id,
            postId: saved.id,
            post: saved,
            type: block.type,
            value: block.value,
            layoutRow: block.layout.row,
            layoutCol: block.layout.col,
            layoutSpan: block.layout.span,
          }),
        );
        if (updatedBlocks.length > 0) {
          await blockRepo.save(updatedBlocks);
        }

        await this.syncBlockMediaEntries(mediaRepo, saved.id, saved, blocks);

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

        draft.isActive = false;
        await draftRepo.save(draft);
      });

      this.draftStateService.clearTouchedBy(draftId);
      this.updateGroupLastActivity(groupId, postId);
      this.postDraftGateway.broadcastDraftPublished(draftId, postId);
      return postId;
    } catch (error) {
      const currentVersion = await this.getDraftCurrentVersion(draftId);
      this.postDraftGateway.broadcastDraftPublishEnded(
        draftId,
        currentVersion ?? undefined,
      );
      if (error instanceof QueryFailedError) {
        const dbError = error as { code?: string };
        if (dbError.code === '23505') {
          throw new ConflictException('Duplicate blockId.');
        }
      }
      throw error;
    } finally {
      this.draftStateService.finishPublishing(draftId);
    }
  }

  private updateGroupLastActivity(groupId: string, postId: string) {
    void this.postRepository.manager
      .getRepository(Group)
      .createQueryBuilder()
      .update()
      .set({
        lastActivityAt: () =>
          '(SELECT updated_at FROM posts WHERE id = :postId)',
      })
      .where('id = :groupId', { groupId, postId })
      .execute()
      .catch((error) => {
        const message =
          error instanceof Error ? error.message : 'unknown error';
        this.logger.warn(
          `Failed to update group lastActivityAt (groupId=${groupId}, postId=${postId}): ${message}`,
        );
      });
  }

  private async getDraftCurrentVersion(draftId: string) {
    try {
      const draft = await this.postRepository.manager
        .getRepository(PostDraft)
        .findOne({
          where: { id: draftId },
          select: { version: true },
        });
      return draft?.version ?? null;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'unknown error';
      this.logger.warn(
        `Failed to load draft version (draftId=${draftId}): ${message}`,
      );
      return null;
    }
  }

  private ensureBlockIds(blocks: CreatePostDto['blocks']) {
    const seen = new Set<string>();
    for (const block of blocks) {
      if (!block.id || !isUUID(block.id)) {
        throw new BadRequestException('block.id must be a UUID.');
      }
      if (seen.has(block.id)) {
        throw new BadRequestException('Duplicate blockId in blocks.');
      }
      seen.add(block.id);
    }
  }

  private ensureNoDuplicateBlockIds(blocks: CreatePostDto['blocks']) {
    const ids = blocks.map((block) => block.id).filter(Boolean);
    if (ids.length === 0) return;
    const unique = new Set(ids);
    if (unique.size !== ids.length) {
      throw new BadRequestException('Duplicate blockId in blocks.');
    }
  }

  private parseGroupDraftSnapshot(
    snapshot: unknown,
    groupId: string,
  ): Pick<CreatePostDto, 'title' | 'blocks' | 'groupId' | 'scope'> {
    const candidate = snapshot as Partial<CreatePostDto> | null | undefined;
    if (
      !candidate ||
      candidate.scope !== PostScope.GROUP ||
      typeof candidate.title !== 'string' ||
      !Array.isArray(candidate.blocks)
    ) {
      throw new BadRequestException('Draft snapshot is invalid.');
    }
    if (candidate.groupId && candidate.groupId !== groupId) {
      throw new BadRequestException('groupId mismatch.');
    }
    return candidate as Pick<
      CreatePostDto,
      'title' | 'blocks' | 'groupId' | 'scope'
    >;
  }

  private buildBlockMediaEntries(
    mediaRepo: Repository<PostMedia>,
    blocks: CreatePostDto['blocks'],
    postId: string,
    post: Post,
  ): PostMedia[] {
    const entries: PostMedia[] = [];
    blocks.forEach((block) => {
      if (block.type !== PostBlockType.IMAGE) return;
      const mediaIds = (block.value as BlockValueMap['IMAGE'])?.mediaIds;
      if (!Array.isArray(mediaIds) || mediaIds.length === 0) return;
      mediaIds.forEach((mediaId, sortIndex) => {
        if (typeof mediaId !== 'string') return;
        entries.push(
          mediaRepo.create({
            postId,
            post,
            mediaId,
            kind: PostMediaKind.BLOCK,
            blockId: block.id,
            sortOrder: sortIndex + 1,
          }),
        );
      });
    });
    return entries;
  }

  private async syncBlockMediaEntries(
    mediaRepo: Repository<PostMedia>,
    postId: string,
    post: Post,
    blocks: CreatePostDto['blocks'],
  ) {
    // 이미지 블록 기준으로 목표 media 목록 구성 (blockId -> mediaIds[])
    const desired = new Map<string, string[]>();
    blocks.forEach((block) => {
      if (block.type !== PostBlockType.IMAGE) return;
      if (!block.id) return;
      const mediaIds = (block.value as BlockValueMap['IMAGE'])?.mediaIds;
      if (!Array.isArray(mediaIds) || mediaIds.length === 0) return;
      const filtered = mediaIds.filter((id) => typeof id === 'string');
      if (filtered.length === 0) return;
      desired.set(block.id, filtered);
    });

    // 현재 post의 BLOCK 미디어 조회
    const existing = await mediaRepo.find({
      where: { postId, kind: PostMediaKind.BLOCK },
      select: { id: true, blockId: true, mediaId: true, sortOrder: true },
    });

    // (blockId, sortOrder) 기준으로 기존 미디어 인덱싱
    const existingByKey = new Map<string, PostMedia>();
    existing.forEach((entry) => {
      if (!entry.blockId || !entry.sortOrder) return;
      existingByKey.set(`${entry.blockId}:${entry.sortOrder}`, entry);
    });

    // 기존/목표 비교로 삭제/업데이트/삽입 목록 산출
    const toDelete: string[] = [];
    const toUpdate: Array<{ id: string; mediaId: string }> = [];
    const toInsert: PostMedia[] = [];

    existing.forEach((entry) => {
      if (!entry.id || !entry.blockId || !entry.sortOrder) return;
      const list = desired.get(entry.blockId);
      if (!list) {
        toDelete.push(entry.id);
        return;
      }
      const index = entry.sortOrder - 1;
      const nextMediaId = list[index];
      if (!nextMediaId) {
        toDelete.push(entry.id);
        return;
      }
      if (entry.mediaId !== nextMediaId) {
        toUpdate.push({ id: entry.id, mediaId: nextMediaId });
      }
    });

    desired.forEach((list, blockId) => {
      list.forEach((mediaId, index) => {
        const sortOrder = index + 1;
        const key = `${blockId}:${sortOrder}`;
        if (existingByKey.has(key)) return;
        toInsert.push(
          mediaRepo.create({
            postId,
            post,
            mediaId,
            kind: PostMediaKind.BLOCK,
            blockId,
            sortOrder,
          }),
        );
      });
    });

    // 최소 변경으로 적용
    if (toDelete.length > 0) {
      await mediaRepo.delete(toDelete);
    }
    if (toUpdate.length > 0) {
      await Promise.all(
        toUpdate.map((entry) =>
          mediaRepo.update({ id: entry.id }, { mediaId: entry.mediaId }),
        ),
      );
    }
    if (toInsert.length > 0) {
      await mediaRepo.save(toInsert);
    }
  }
}
