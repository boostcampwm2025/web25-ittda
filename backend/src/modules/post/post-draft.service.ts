import {
  ConflictException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { IsNull, QueryFailedError, Repository } from 'typeorm';
import { isUUID, validateSync } from 'class-validator';
import { plainToInstance } from 'class-transformer';
import { randomUUID } from 'crypto';
import { DateTime } from 'luxon';

import { PostDraft } from './entity/post-draft.entity';
import { PostDraftMedia } from './entity/post-draft-media.entity';
import { Post } from './entity/post.entity';
import { PostBlock } from './entity/post-block.entity';
import { Group } from '@/modules/group/entity/group.entity';
import { GroupMember } from '@/modules/group/entity/group_member.entity';
import { CreatePostDto } from './dto/create-post.dto';
import { PostScope } from '@/enums/post-scope.enum';
import { GroupRoleEnum } from '@/enums/group-role.enum';
import type { BlockMoveListCommand, PatchCommand } from './collab/types';
import { PostBlockDto } from './dto/post-block.dto';
import { PostBlockType } from '@/enums/post-block-type.enum';

@Injectable()
export class PostDraftService {
  private static readonly CREATE_DRAFT_LIMIT = 5;

  constructor(
    @InjectRepository(PostDraft)
    private readonly postDraftRepository: Repository<PostDraft>,
    @InjectRepository(Post)
    private readonly postRepository: Repository<Post>,
    @InjectRepository(PostBlock)
    private readonly postBlockRepository: Repository<PostBlock>,
    @InjectRepository(Group)
    private readonly groupRepository: Repository<Group>,
    @InjectRepository(GroupMember)
    private readonly groupMemberRepository: Repository<GroupMember>,
  ) {}

  async getOrCreateGroupCreateDraft(
    groupId: string,
    actorId: string,
  ): Promise<PostDraft> {
    await this.ensureGroupEditor(groupId, actorId);

    return this.postDraftRepository.manager.transaction(async (manager) => {
      const groupRepo = manager.getRepository(Group);
      const draftRepo = manager.getRepository(PostDraft);

      const group = await groupRepo.findOne({
        where: { id: groupId },
        select: { id: true },
        lock: { mode: 'pessimistic_write' },
      });
      if (!group) throw new NotFoundException('Group not found');

      const activeDrafts = await draftRepo
        .createQueryBuilder('draft')
        .setLock('pessimistic_write')
        .where('draft.groupId = :groupId', { groupId })
        .andWhere('draft.isActive = true')
        .andWhere("draft.kind = 'CREATE'")
        .getMany();

      const usedSlots = new Set<number>();
      activeDrafts.forEach((draft) => {
        if (typeof draft.createSlot === 'number') {
          usedSlots.add(draft.createSlot);
        }
      });

      let availableSlot: number | null = null;
      for (
        let slot = 1;
        slot <= PostDraftService.CREATE_DRAFT_LIMIT;
        slot += 1
      ) {
        if (!usedSlots.has(slot)) {
          availableSlot = slot;
          break;
        }
      }

      if (!availableSlot) {
        throw new ConflictException('Active create draft limit reached.');
      }

      const draft = draftRepo.create({
        groupId,
        ownerActorId: actorId,
        kind: 'CREATE',
        createSlot: availableSlot,
        snapshot: this.buildDefaultDraftSnapshot(groupId),
      });

      try {
        return await draftRepo.save(draft);
      } catch (error) {
        const dbError = error as { code?: string };
        if (error instanceof QueryFailedError && dbError.code === '23505') {
          throw new ConflictException('Active create draft limit reached.');
        }
        if (error instanceof QueryFailedError) {
          throw new InternalServerErrorException('Failed to create draft.');
        }
        throw error;
      }
    });
  }

  async getGroupDraft(
    groupId: string,
    draftId: string,
    requesterId: string,
  ): Promise<PostDraft> {
    await this.ensureGroupEditor(groupId, requesterId);
    const draft = await this.postDraftRepository.findOne({
      where: { id: draftId, groupId, isActive: true },
    });
    if (!draft) throw new NotFoundException('Draft not found');
    return draft;
  }

  async getOrCreateGroupEditDraft(
    groupId: string,
    postId: string,
    actorId: string,
  ): Promise<PostDraft> {
    await this.ensureGroupEditor(groupId, actorId);

    const post = await this.postRepository.findOne({
      where: { id: postId, deletedAt: IsNull() },
      select: { id: true, scope: true, groupId: true, title: true },
    });
    if (!post) throw new NotFoundException('Post not found');
    if (post.scope !== PostScope.GROUP || post.groupId !== groupId) {
      throw new BadRequestException('Post does not belong to this group.');
    }

    const existing = await this.postDraftRepository.findOne({
      where: {
        groupId,
        isActive: true,
        kind: 'EDIT',
        targetPostId: postId,
      },
    });
    if (existing) return existing;

    const blocks = await this.postBlockRepository.find({
      where: { postId },
      order: { layoutRow: 'ASC', layoutCol: 'ASC', layoutSpan: 'ASC' },
    });
    const snapshot = this.buildEditDraftSnapshot(post, blocks, groupId);

    const draft = this.postDraftRepository.create({
      groupId,
      ownerActorId: actorId,
      kind: 'EDIT',
      targetPostId: postId,
      snapshot,
    });

    try {
      return await this.postDraftRepository.save(draft);
    } catch (error) {
      const dbError = error as { code?: string };
      if (error instanceof QueryFailedError && dbError.code === '23505') {
        const concurrent = await this.postDraftRepository.findOne({
          where: {
            groupId,
            isActive: true,
            kind: 'EDIT',
            targetPostId: postId,
          },
        });
        if (concurrent) return concurrent;
        throw new ConflictException(
          'Active edit draft already exists for this post.',
        );
      }
      if (error instanceof QueryFailedError) {
        throw new InternalServerErrorException('Failed to create edit draft.');
      }
      throw error;
    }
  }

  async applyPatch(
    draftId: string,
    baseVersion: number,
    patch: PatchCommand | PatchCommand[],
  ) {
    const commands = Array.isArray(patch) ? patch : [patch];
    this.ensureNoDuplicateBlockIds(commands);

    return this.postDraftRepository.manager.transaction(async (manager) => {
      const repo = manager.getRepository(PostDraft);
      const draft = await repo.findOne({
        where: { id: draftId, isActive: true },
        lock: { mode: 'pessimistic_write' },
      });
      if (!draft) throw new NotFoundException('Draft not found');
      if (draft.version !== baseVersion) {
        return { status: 'stale', currentVersion: draft.version } as const;
      }

      const snapshot = this.applyPatchToSnapshot(
        this.parseSnapshot(draft.snapshot),
        commands,
      );
      draft.snapshot = snapshot as unknown as Record<string, unknown>;
      draft.version += 1;
      await repo.save(draft);

      const mediaRepo = manager.getRepository(PostDraftMedia);
      const mediaIds = this.collectDraftMediaIds(snapshot);
      await mediaRepo.delete({ draftId });
      const entries = Array.from(new Set(mediaIds)).map((mediaId) =>
        mediaRepo.create({ draftId, mediaId }),
      );
      if (entries.length > 0) {
        await mediaRepo.save(entries);
      }
      return {
        status: 'committed',
        version: draft.version,
        snapshot,
      } as const;
    });
  }

  private buildDefaultDraftSnapshot(groupId: string): Record<string, unknown> {
    const now = DateTime.now().setZone('Asia/Seoul');
    const snapshot: Omit<CreatePostDto, 'thumbnailMediaId'> = {
      scope: PostScope.GROUP,
      groupId,
      title: '',
      blocks: [
        {
          id: randomUUID(),
          type: PostBlockType.DATE,
          value: { date: now.toISODate() ?? '' },
          layout: { row: 1, col: 1, span: 1 },
        },
        {
          id: randomUUID(),
          type: PostBlockType.TIME,
          value: { time: now.toFormat('HH:mm') },
          layout: { row: 1, col: 2, span: 1 },
        },
        {
          id: randomUUID(),
          type: PostBlockType.TEXT,
          value: { text: '' },
          layout: { row: 2, col: 1, span: 2 },
        },
      ],
    };
    return snapshot as unknown as Record<string, unknown>;
  }

  private buildEditDraftSnapshot(
    post: Pick<Post, 'title' | 'groupId'>,
    blocks: PostBlock[],
    groupId: string,
  ): Record<string, unknown> {
    const snapshot: CreatePostDto = {
      scope: PostScope.GROUP,
      groupId,
      title: post.title,
      blocks: blocks.map((block) => ({
        id: block.id,
        type: block.type,
        value: block.value,
        layout: {
          row: block.layoutRow,
          col: block.layoutCol,
          span: block.layoutSpan,
        },
      })),
    };
    return snapshot as unknown as Record<string, unknown>;
  }

  private async ensureGroupEditor(groupId: string, userId: string) {
    const member = await this.groupMemberRepository.findOne({
      where: { groupId, userId },
      select: { role: true },
    });
    if (!member) {
      throw new ForbiddenException('Not a group member.');
    }
    if (member.role === GroupRoleEnum.VIEWER) {
      throw new ForbiddenException('Insufficient permission.');
    }
  }

  private ensureNoDuplicateBlockIds(commands: PatchCommand[]) {
    const seen = new Set<string>();
    for (const command of commands) {
      if (this.isBlockMoveList(command)) {
        command.moves.forEach((move) => {
          const blockId = move.blockId;
          if (seen.has(blockId)) {
            throw new BadRequestException(
              'Duplicate blockId in patch payload.',
            );
          }
          seen.add(blockId);
        });
        continue;
      }
      const blockId =
        command.type === 'BLOCK_INSERT'
          ? command.block?.id
          : 'blockId' in command
            ? command.blockId
            : null;
      if (!blockId) continue;
      if (seen.has(blockId)) {
        throw new BadRequestException('Duplicate blockId in patch payload.');
      }
      seen.add(blockId);
    }
  }

  private applyPatchToSnapshot(
    snapshot: CreatePostDto,
    commands: PatchCommand[],
  ): CreatePostDto {
    if (!snapshot || !Array.isArray(snapshot.blocks)) {
      throw new BadRequestException('Draft snapshot is invalid.');
    }

    const next: CreatePostDto = {
      ...snapshot,
      blocks: [...snapshot.blocks],
    };

    for (const command of commands) {
      switch (command.type) {
        case 'BLOCK_SET_TITLE': {
          if (typeof command.title !== 'string') {
            throw new BadRequestException('title must be a string.');
          }
          next.title = command.title;
          break;
        }
        case 'BLOCK_INSERT': {
          const block = command.block;
          const blockId = block?.id;
          if (!blockId || !isUUID(blockId)) {
            throw new BadRequestException('block.id must be a UUID.');
          }
          const exists = next.blocks.some((item) => item.id === blockId);
          if (exists) {
            throw new ConflictException('blockId already exists.');
          }
          this.ensureBlockValueValid(block);
          next.blocks.push(block);
          break;
        }
        case 'BLOCK_DELETE': {
          if (!isUUID(command.blockId)) {
            throw new BadRequestException('blockId must be a UUID.');
          }
          const before = next.blocks.length;
          next.blocks = next.blocks.filter(
            (item) => item.id !== command.blockId,
          );
          if (before === next.blocks.length) {
            throw new NotFoundException('Block not found.');
          }
          break;
        }
        case 'BLOCK_MOVE': {
          const moves = this.isBlockMoveList(command)
            ? command.moves
            : [command];
          if (!Array.isArray(moves) || moves.length === 0) {
            throw new BadRequestException('moves must be a non-empty array.');
          }
          for (const move of moves) {
            const blockId = move.blockId;
            if (!blockId || !isUUID(blockId)) {
              throw new BadRequestException(
                `blockId must be a UUID: ${String(blockId)}`,
              );
            }
            const target = next.blocks.find((item) => item.id === blockId);
            if (!target) {
              throw new NotFoundException('Block not found.');
            }
            this.ensureBlockValueValid({
              ...target,
              layout: move.layout,
            });
            target.layout = move.layout;
          }
          break;
        }
        case 'BLOCK_SET_VALUE': {
          if (!isUUID(command.blockId)) {
            throw new BadRequestException('blockId must be a UUID.');
          }
          const target = next.blocks.find(
            (item) => item.id === command.blockId,
          );
          if (!target) {
            throw new NotFoundException('Block not found.');
          }
          this.ensureBlockValueValid({
            ...target,
            value: command.value as typeof target.value,
          });
          target.value = command.value as typeof target.value;
          break;
        }
        default:
          throw new BadRequestException('Unknown patch command.');
      }
    }

    return next;
  }

  private isBlockMoveList(
    command: PatchCommand,
  ): command is BlockMoveListCommand {
    return (
      command.type === 'BLOCK_MOVE' &&
      'moves' in command &&
      Array.isArray(command.moves)
    );
  }

  private parseSnapshot(snapshot: Record<string, unknown>): CreatePostDto {
    if (!this.isDraftSnapshot(snapshot)) {
      throw new BadRequestException('Draft snapshot is invalid.');
    }
    return snapshot;
  }

  private isDraftSnapshot(snapshot: unknown): snapshot is CreatePostDto {
    if (!snapshot || typeof snapshot !== 'object') return false;
    const candidate = snapshot as Partial<CreatePostDto>;
    if (typeof candidate.scope !== 'string') return false;
    if (typeof candidate.title !== 'string') return false;
    if (!Array.isArray(candidate.blocks)) return false;
    return true;
  }

  private ensureBlockValueValid(block: PostBlockDto) {
    if (block.type === PostBlockType.MOOD) {
      const mood = (block.value as { mood?: unknown } | undefined)?.mood;
      if (mood === undefined || mood === null || mood === '') {
        return;
      }
    }
    if (block.type === PostBlockType.MEDIA) {
      const media = block.value as
        | { title?: unknown; type?: unknown; externalId?: unknown }
        | undefined;
      if (
        !media ||
        typeof media.title !== 'string' ||
        media.title.trim().length === 0 ||
        typeof media.type !== 'string' ||
        media.type.trim().length === 0 ||
        typeof media.externalId !== 'string' ||
        media.externalId.trim().length === 0
      ) {
        return;
      }
    }
    const candidate = plainToInstance(PostBlockDto, block); // 일반 객체를 DTO 인스턴스로 변환하는 함수
    const errors = validateSync(candidate, { forbidUnknownValues: false }); // class-validator로 즉시(동기) 검증하는 함수
    if (errors.length === 0) return;
    const message =
      errors
        .flatMap((error) => Object.values(error.constraints ?? {}))
        .find((value) => value.length > 0) ?? 'block value is invalid.';
    throw new BadRequestException(message);
  }

  private collectDraftMediaIds(snapshot: CreatePostDto): string[] {
    const mediaIds: string[] = [];
    for (const block of snapshot.blocks) {
      if (block.type !== PostBlockType.IMAGE) continue;
      const value = block.value as { mediaIds?: unknown } | undefined;
      if (!value || !Array.isArray(value.mediaIds)) continue;
      value.mediaIds.forEach((id) => {
        if (typeof id === 'string') mediaIds.push(id);
      });
    }
    return mediaIds;
  }
}
