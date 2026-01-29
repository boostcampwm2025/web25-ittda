import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
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
import { validateBlocks } from './validator/blocks.validator';
import { BlockValueMap } from './types/post-block.types';
import { extractMetaFromBlocks } from './validator/meta.extractor';
import { resolveEventAtFromBlocks } from './validator/event-at.resolver';

@Injectable()
export class PostPublishService {
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
    const { draftId, draftVersion, post } = payload;
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

          if (post.scope !== PostScope.GROUP) {
            throw new BadRequestException('scope must be GROUP.');
          }
          const resolvedGroupId = post.groupId ?? groupId;
          if (post.groupId && post.groupId !== groupId) {
            throw new BadRequestException('groupId mismatch.');
          }

          const draft = await draftRepo.findOne({
            where: { id: draftId, groupId: resolvedGroupId, isActive: true },
            lock: { mode: 'pessimistic_write' },
          });
          if (!draft) throw new NotFoundException('Draft not found');
          if (draft.version !== draftVersion) {
            throw new ConflictException('Draft version mismatch.');
          }

          const member = await memberRepo.findOne({
            where: { groupId: resolvedGroupId, userId: requesterId },
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
            where: { id: resolvedGroupId },
          });
          if (!group) throw new NotFoundException('Group not found');

          validateBlocks(post.blocks);
          this.ensureBlockIds(post.blocks);

          const meta = extractMetaFromBlocks(post.blocks);
          const eventAt = resolveEventAtFromBlocks(meta.date, meta.time);
          const location: Point | undefined = meta.location
            ? {
                type: 'Point',
                coordinates: [meta.location.lng, meta.location.lat],
              }
            : undefined;

          const created = postRepo.create({
            scope: post.scope,
            ownerUserId: draft.ownerActorId,
            ownerUser: owner,
            groupId: resolvedGroupId,
            group,
            title: post.title,
            location: location ?? undefined,
            eventAt,
            tags: meta.tags ?? null,
            emotion: meta.emotion ?? null,
            rating: meta.rating ?? null,
          });
          const saved = await postRepo.save(created);

          await groupRepo.update(resolvedGroupId, {
            lastActivityAt: saved.updatedAt,
          });

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

          const blocks = post.blocks.map((block) =>
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
          if (blocks.length > 0) {
            await blockRepo.save(blocks);
          }

          const mediaEntries: PostMedia[] = [];
          if (post.thumbnailMediaId) {
            mediaEntries.push(
              mediaRepo.create({
                postId: saved.id,
                post: saved,
                mediaId: post.thumbnailMediaId,
                kind: PostMediaKind.THUMBNAIL,
              }),
            );
          }

          post.blocks.forEach((block) => {
            if (block.type !== PostBlockType.IMAGE) return;
            const mediaIds = (block.value as BlockValueMap['IMAGE'])?.mediaIds;
            if (!Array.isArray(mediaIds) || mediaIds.length === 0) return;
            mediaIds.forEach((mediaId, sortIndex) => {
              if (typeof mediaId !== 'string') return;
              mediaEntries.push(
                mediaRepo.create({
                  postId: saved.id,
                  post: saved,
                  mediaId,
                  kind: PostMediaKind.BLOCK,
                  blockId: block.id,
                  sortOrder: sortIndex + 1,
                }),
              );
            });
          });

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
      this.postDraftGateway.broadcastDraftPublished(draftId, postId);
      return postId;
    } catch (error) {
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
    const { draftId, draftVersion, post: snapshot } = payload;
    if (!this.draftStateService.startPublishing(draftId)) {
      throw new ConflictException('Draft is already publishing.');
    }

    try {
      await this.postRepository.manager.transaction(async (manager) => {
        const draftRepo = manager.getRepository(PostDraft);
        const postRepo = manager.getRepository(Post);
        const blockRepo = manager.getRepository(PostBlock);
        const contributorRepo = manager.getRepository(PostContributor);
        const groupRepo = manager.getRepository(Group);
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

        // TODO: edit에서는 group 체크가 불필요할 수도?
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

        if (
          !snapshot ||
          typeof snapshot.title !== 'string' ||
          !Array.isArray(snapshot.blocks)
        ) {
          throw new BadRequestException('Draft snapshot is invalid.');
        }

        if (snapshot.scope !== PostScope.GROUP) {
          throw new BadRequestException('scope must be GROUP.');
        }
        if (snapshot.groupId && snapshot.groupId !== groupId) {
          throw new BadRequestException('groupId mismatch.');
        }

        const blocks = snapshot.blocks;
        validateBlocks(blocks);
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

        await groupRepo.update(groupId, {
          lastActivityAt: saved.updatedAt,
        });
      });

      this.draftStateService.clearTouchedBy(draftId);
      this.postDraftGateway.broadcastDraftPublished(draftId, postId);
      return postId;
    } catch (error) {
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

  private ensureBlockIds(blocks: PublishDraftDto['post']['blocks']) {
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

  private ensureNoDuplicateBlockIds(blocks: PublishDraftDto['post']['blocks']) {
    const ids = blocks.map((block) => block.id).filter(Boolean);
    if (ids.length === 0) return;
    const unique = new Set(ids);
    if (unique.size !== ids.length) {
      throw new BadRequestException('Duplicate blockId in blocks.');
    }
  }
}
