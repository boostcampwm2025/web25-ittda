import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { Post } from './entity/post.entity';
import { User } from '@/modules/user/user.entity';
import { Group } from '@/modules/group/entity/group.entity';
import { CreatePostDto } from './dto/create-post.dto';
import { PostScope } from '@/enums/post-scope.enum';
import { Point } from 'geojson';

@Injectable()
export class PostService {
  constructor(
    @InjectRepository(Post)
    private readonly postRepository: Repository<Post>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(Group)
    private readonly groupRepository: Repository<Group>,
  ) {}

  async createPost(ownerUserId: string, dto: CreatePostDto) {
    const owner = await this.userRepository.findOne({
      where: { id: ownerUserId },
    });
    if (!owner) throw new BadRequestException('Owner not found');

    // scope/group 일관성 검사
    if (dto.scope === PostScope.GROUP && !dto.groupId) {
      throw new BadRequestException('groupId is required when scope=GROUP');
    }
    if (dto.scope === PostScope.PERSONAL && dto.groupId) {
      throw new BadRequestException(
        'groupId must be omitted when scope=PERSONAL',
      );
    }

    // group 검증
    let group: Group | null = null;
    if (dto.groupId) {
      group = await this.groupRepository.findOne({
        where: { id: dto.groupId },
      });
      if (!group) throw new BadRequestException('Group not found');
    }

    const groupId: string | null =
      dto.scope === PostScope.GROUP ? (dto.groupId ?? null) : null;

    const eventAt = dto.eventAt ? new Date(dto.eventAt) : undefined;
    if (dto.eventAt && Number.isNaN(eventAt!.getTime())) {
      throw new BadRequestException('eventAt must be a valid ISO date string');
    }

    const location: Point | undefined = dto.location
      ? {
          type: 'Point',
          coordinates: [dto.location.lng, dto.location.lat], // [lng, lat] 순서
        }
      : undefined;

    const tags: string[] | null =
      dto.tags
        ?.map((t) => t.trim())
        .filter((t) => t.length > 0)
        .slice(0, 10) ?? null;

    const post = this.postRepository.create({
      scope: dto.scope,
      ownerUserId,
      ownerUser: owner,
      groupId: groupId,
      group: dto.scope === PostScope.GROUP ? group : null,
      title: dto.title,
      location: location ?? undefined,
      eventAt,
      tags,
      rating: dto.rating ?? null,
    });

    const saved = await this.postRepository.save(post);
    return this.findOne(saved.id);
  }

  async findOne(postId: string) {
    // 관계를 포함하여 반환하기 위해서

    const post = await this.postRepository.findOne({
      where: { id: postId },
      relations: ['ownerUser', 'group'],
    });
    if (!post) throw new NotFoundException('Post not found');
    return post;
  }
}
