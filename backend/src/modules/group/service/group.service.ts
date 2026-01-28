// group.service.ts: 그룹의 핵심 기능(생성, 삭제, 수정, 목록 조회, 멤버 조회 유틸)
import {
  Injectable,
  InternalServerErrorException,
  BadRequestException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { Group } from '../entity/group.entity';
import { GroupMember } from '../entity/group_member.entity';
import { GroupRoleEnum } from '@/enums/group-role.enum';
import { User } from '../../user/entity/user.entity';
import { Post } from '@/modules/post/entity/post.entity';
import { GetGroupsResponseDto, GroupItemDto } from '../dto/get-groups.dto';

const GROUP_NICKNAME_REGEX = /^[a-zA-Z0-9가-힣 ]+$/;

@Injectable()
export class GroupService {
  constructor(
    @InjectRepository(Group)
    private readonly groupRepo: Repository<Group>,

    @InjectRepository(GroupMember)
    private readonly groupMemberRepo: Repository<GroupMember>,

    @InjectRepository(User)
    private readonly userRepo: Repository<User>,

    @InjectRepository(Post)
    private readonly postRepo: Repository<Post>,

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
    return this.groupMemberRepo.findOne({
      where: {
        userId,
        groupId,
      },
      relations: ['group', 'user'],
    });
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

  /** 그룹 목록 조회 (최신 활동 순) */
  async getGroups(userId: string): Promise<GetGroupsResponseDto> {
    const members = await this.groupMemberRepo.find({
      where: { userId },
      select: ['groupId'],
    });

    if (members.length === 0) {
      return { items: [] };
    }

    const groupIds = members.map((m) => m.groupId);

    const items = await Promise.all(
      groupIds.map(async (groupId) => {
        const group = await this.groupRepo.findOne({
          where: { id: groupId },
          relations: ['coverMedia'],
        });

        if (!group) return null;

        const memberCount = await this.groupMemberRepo.count({
          where: { groupId },
        });

        const recordCount = await this.postRepo.count({
          where: { groupId },
        });

        const latestPost = await this.postRepo.findOne({
          where: { groupId },
          order: { eventAt: 'DESC' },
          select: ['id', 'title', 'eventAt', 'location', 'createdAt'],
        });

        const lastActivityAt = group.lastActivityAt || group.createdAt;

        return {
          groupId: group.id,
          name: group.name,
          cover: group.coverMedia
            ? {
                assetId: group.coverMedia.id,
                width: group.coverMedia.width,
                height: group.coverMedia.height,
                mimeType: group.coverMedia.mimeType,
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
        };
      }),
    );

    const validItems = items.filter((item) => item !== null) as GroupItemDto[];

    validItems.sort((a, b) => {
      const timeA = a.lastActivityAt ? new Date(a.lastActivityAt).getTime() : 0;
      const timeB = b.lastActivityAt ? new Date(b.lastActivityAt).getTime() : 0;
      return timeB - timeA;
    });

    return { items: validItems };
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
}
