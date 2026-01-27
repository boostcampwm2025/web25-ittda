import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { QueryFailedError, Repository } from 'typeorm';
import type { Point } from 'geojson';
import { isUUID } from 'class-validator';

import { PostDraft } from './entity/post-draft.entity';
import { Post } from './entity/post.entity';
import { PostBlock } from './entity/post-block.entity';
import { PostContributor } from './entity/post-contributor.entity';
import { User } from '@/modules/user/entity/user.entity';
import { Group } from '@/modules/group/entity/group.entity';
import { GroupMember } from '@/modules/group/entity/group_member.entity';
import { DraftStateService } from './collab/draft-state.service';
import { PostDraftGateway } from './post-draft.gateway';
import { PublishDraftDto } from './dto/publish-draft.dto';
import { PostScope } from '@/enums/post-scope.enum';
import { GroupRoleEnum } from '@/enums/group-role.enum';
import { PostContributorRole } from '@/enums/post-contributor-role.enum';
import { validateBlocks } from './validator/blocks.validator';
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

    try {
      const postId = await this.postRepository.manager.transaction(
        async (manager) => {
          const draftRepo = manager.getRepository(PostDraft);
          const postRepo = manager.getRepository(Post);
          const blockRepo = manager.getRepository(PostBlock);
          const contributorRepo = manager.getRepository(PostContributor);
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
          const contributorIds = Array.from(new Set(touchedBy));
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

          draft.isActive = false;
          await draftRepo.save(draft);

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
}
