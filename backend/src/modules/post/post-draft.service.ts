import {
  ConflictException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { QueryFailedError, Repository } from 'typeorm';

import { PostDraft } from './entity/post-draft.entity';
import { Group } from '@/modules/group/entity/group.entity';
import { CreatePostDto } from './dto/create-post.dto';
import { PostScope } from '@/enums/post-scope.enum';

@Injectable()
export class PostDraftService {
  constructor(
    @InjectRepository(PostDraft)
    private readonly postDraftRepository: Repository<PostDraft>,
    @InjectRepository(Group)
    private readonly groupRepository: Repository<Group>,
  ) {}

  async getOrCreateGroupDraft(groupId: string, ownerActorId: string) {
    const group = await this.groupRepository.findOne({
      where: { id: groupId },
      select: { id: true },
    });
    if (!group) throw new NotFoundException('Group not found');

    const existing = await this.postDraftRepository.findOne({
      where: { groupId, isActive: true },
    });
    if (existing) return existing;

    const draft = this.postDraftRepository.create({
      groupId,
      ownerActorId,
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

  async getGroupDraft(groupId: string, draftId: string) {
    const draft = await this.postDraftRepository.findOne({
      where: { id: draftId, groupId, isActive: true },
    });
    if (!draft) throw new NotFoundException('Draft not found');
    return draft;
  }

  private buildDefaultDraftSnapshot(groupId: string) {
    const snapshot: Omit<CreatePostDto, 'thumbnailMediaId'> = {
      scope: PostScope.GROUP,
      groupId,
      title: '',
      blocks: [],
    };
    return snapshot;
  }
}
