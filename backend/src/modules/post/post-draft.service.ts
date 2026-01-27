import {
  ConflictException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { QueryFailedError, Repository } from 'typeorm';
import { isUUID, validateSync } from 'class-validator';
import { plainToInstance } from 'class-transformer';
import { randomUUID } from 'crypto';

import { PostDraft } from './entity/post-draft.entity';
import { Group } from '@/modules/group/entity/group.entity';
import { GroupMember } from '@/modules/group/entity/group_member.entity';
import { CreatePostDto } from './dto/create-post.dto';
import { PostScope } from '@/enums/post-scope.enum';
import type { PatchCommand } from './collab/types';
import { PostBlockDto } from './dto/post-block.dto';
import { PostBlockType } from '@/enums/post-block-type.enum';

@Injectable()
export class PostDraftService {
  constructor(
    @InjectRepository(PostDraft)
    private readonly postDraftRepository: Repository<PostDraft>,
    @InjectRepository(Group)
    private readonly groupRepository: Repository<Group>,
    @InjectRepository(GroupMember)
    private readonly groupMemberRepository: Repository<GroupMember>,
  ) {}

  async getOrCreateGroupDraft(groupId: string, actorId: string) {
    const group = await this.groupRepository.findOne({
      where: { id: groupId },
      select: { id: true },
    });
    if (!group) throw new NotFoundException('Group not found');
    await this.ensureGroupMember(groupId, actorId);

    const existing = await this.postDraftRepository.findOne({
      where: { groupId, isActive: true },
    });
    if (existing) return existing;

    const draft = this.postDraftRepository.create({
      groupId,
      ownerActorId: actorId,
      snapshot: this.buildDefaultDraftSnapshot(groupId),
    });

    try {
      return await this.postDraftRepository.save(draft);
    } catch (error) {
      const dbError = error as { code?: string };
      if (error instanceof QueryFailedError && dbError.code === '23505') {
        const concurrent = await this.postDraftRepository.findOne({
          where: { groupId, isActive: true },
        });
        if (concurrent) return concurrent;
        throw new ConflictException(
          'Active draft already exists for this group.',
        );
      }
      if (error instanceof QueryFailedError) {
        throw new InternalServerErrorException('Failed to create draft.');
      }
      throw error;
    }
  }

  async getGroupDraft(groupId: string, draftId: string, requesterId: string) {
    await this.ensureGroupMember(groupId, requesterId);
    const draft = await this.postDraftRepository.findOne({
      where: { id: draftId, groupId, isActive: true },
    });
    if (!draft) throw new NotFoundException('Draft not found');
    return draft;
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
      return {
        status: 'committed',
        version: draft.version,
        snapshot,
      } as const;
    });
  }

  private buildDefaultDraftSnapshot(groupId: string) {
    const snapshot: Omit<CreatePostDto, 'thumbnailMediaId'> = {
      scope: PostScope.GROUP,
      groupId,
      title: '',
      blocks: [
        {
          id: randomUUID(),
          type: PostBlockType.DATE,
          value: { date: '' },
          layout: { row: 1, col: 1, span: 1 },
        },
        {
          id: randomUUID(),
          type: PostBlockType.TIME,
          value: { time: '' },
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
    return snapshot;
  }

  private async ensureGroupMember(groupId: string, userId: string) {
    const member = await this.groupMemberRepository.findOne({
      where: { groupId, userId },
      select: { id: true },
    });
    if (!member) {
      throw new ForbiddenException('Not a group member.');
    }
  }

  private ensureNoDuplicateBlockIds(commands: PatchCommand[]) {
    const seen = new Set<string>();
    for (const command of commands) {
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
            layout: command.layout,
          });
          target.layout = command.layout;
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
    const candidate = plainToInstance(PostBlockDto, block); // 일반 객체를 DTO 인스턴스로 변환하는 함수
    const errors = validateSync(candidate, { forbidUnknownValues: false }); // class-validator로 즉시(동기) 검증하는 함수
    if (errors.length === 0) return;
    const message =
      errors
        .flatMap((error) => Object.values(error.constraints ?? {}))
        .find((value) => value.length > 0) ?? 'block value is invalid.';
    throw new BadRequestException(message);
  }
}
