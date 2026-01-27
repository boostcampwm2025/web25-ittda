// group-management.service.ts: 멤버 관리, 그룹 설정, 커버 이미지 등 운영 관련 로직
import {
  Injectable,
  InternalServerErrorException,
  BadRequestException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Group } from '../entity/group.entity';
import { GroupMember } from '../entity/group_member.entity';
import { GroupRoleEnum } from '@/enums/group-role.enum';
import { User } from '../../user/entity/user.entity';
import { Post } from '@/modules/post/entity/post.entity';
import {
  PostMedia,
  PostMediaKind,
} from '@/modules/post/entity/post-media.entity';
import { UpdateGroupCoverResponseDto } from '../dto/update-group-cover.dto';
import { GetGroupSettingsResponseDto } from '../dto/get-group-settings.dto';
import { GetGroupMemberMeResponseDto } from '../dto/get-group-member-me.dto';
import { UpdateGroupMemberMeDto } from '../dto/update-group-member-me.dto';

const GROUP_NICKNAME_REGEX = /^[a-zA-Z0-9가-힣 ]+$/;

@Injectable()
export class GroupManagementService {
  constructor(
    @InjectRepository(Group)
    private readonly groupRepo: Repository<Group>,

    @InjectRepository(GroupMember)
    private readonly groupMemberRepo: Repository<GroupMember>,

    @InjectRepository(User)
    private readonly userRepo: Repository<User>,

    @InjectRepository(Post)
    private readonly postRepo: Repository<Post>,

    @InjectRepository(PostMedia)
    private readonly postMediaRepo: Repository<PostMedia>,
  ) {}

  /** 멤버 초대 (ADMIN만 가능하도록 Controller/Guard에서 제한) */
  async addMember(
    groupId: string,
    userId: string,
    role: GroupRoleEnum,
  ): Promise<GroupMember> {
    try {
      const group = await this.groupRepo.findOneByOrFail({ id: groupId });
      const user = await this.userRepo.findOneByOrFail({ id: userId });

      const member = this.groupMemberRepo.create({
        group,
        user,
        role,
        nicknameInGroup: this.validateGroupNickname(user.nickname),
      });

      return this.groupMemberRepo.save(member);
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (error: unknown) {
      throw new BadRequestException('중복된 멤버이거나 잘못된 요청입니다.');
    }
  }

  /** 멤버 추방 (관리자/방장만 가능) */
  async removeMember(
    requesterId: string,
    groupId: string,
    targetUserId: string,
  ) {
    const requesterMember = await this.groupMemberRepo.findOne({
      where: { groupId, userId: requesterId },
    });

    if (!requesterMember || requesterMember.role !== GroupRoleEnum.ADMIN) {
      throw new ForbiddenException('추방 권한이 없습니다.');
    }

    // 대상이 방장인지 확인 (방장은 추방 불가)
    const group = await this.groupRepo.findOne({
      where: { id: groupId },
      relations: ['owner'],
    });
    if (!group) throw new NotFoundException('그룹을 찾을 수 없습니다.');

    if (group.owner.id === targetUserId) {
      throw new ForbiddenException('방장은 추방할 수 없습니다.');
    }

    // 본인 추방은 leaveGroup 사용
    if (requesterId === targetUserId) {
      throw new ForbiddenException(
        '자기 자신을 추방할 수 없습니다. 나가기를 이용하세요.',
      );
    }

    await this.groupMemberRepo.delete({
      group: { id: groupId },
      user: { id: targetUserId },
    });
  }

  /** 권한 변경 (본인 권한 변경 불가 로직 추가) */
  async updateMemberRole(
    requesterId: string,
    groupId: string,
    userId: string,
    role: GroupRoleEnum,
  ) {
    // 1. 본인 여부 확인
    if (requesterId === userId) {
      throw new ForbiddenException('자신의 권한은 직접 수정할 수 없습니다.');
    }

    try {
      const member = await this.groupMemberRepo.findOneOrFail({
        where: {
          group: { id: groupId },
          user: { id: userId },
        },
      });

      member.role = role;
      return await this.groupMemberRepo.save(member);
    } catch (error) {
      if (error instanceof BadRequestException) throw error;

      throw new InternalServerErrorException(
        '권한 변경 중 오류가 발생했습니다.',
      );
    }
  }

  /** 그룹 나가기 */
  async leaveGroup(userId: string, groupId: string) {
    const group = await this.groupRepo.findOne({
      where: { id: groupId },
      relations: ['owner'],
    });

    if (!group) throw new NotFoundException('그룹이 존재하지 않습니다.');

    // 방장은 못 나감 (삭제하거나 양도해야 함)
    if (group.owner.id === userId) {
      throw new BadRequestException(
        '방장은 그룹을 나갈 수 없습니다. 그룹을 삭제하거나 권한을 양도하세요.',
      );
    }

    const deleteResult = await this.groupMemberRepo.delete({
      group: { id: groupId },
      user: { id: userId },
    });

    if (deleteResult.affected === 0) {
      throw new BadRequestException('그룹 멤버가 아닙니다.');
    }
  }

  /** 그룹 멤버 조회 */
  async getGroupMembers(groupId: string) {
    // 그룹 존재 확인
    const group = await this.groupRepo.findOne({
      where: { id: groupId },
    });

    if (!group) {
      throw new NotFoundException('그룹을 찾을 수 없습니다.');
    }

    // 그룹 멤버 조회 (user 관계 포함)
    const members = await this.groupMemberRepo.find({
      where: { groupId },
      relations: ['user'],
    });

    // 응답 형식으로 변환
    return {
      groupName: group.name,
      groupMemberCount: members.length,
      members: members.map((member) => ({
        memberId: member.user.id,
        profileImageId: member.user.profileImageId,
      })),
    };
  }

  /** 그룹 커버 이미지 수정 */
  async updateGroupCover(
    userId: string,
    groupId: string,
    assetId: string,
    sourcePostId: string,
  ): Promise<UpdateGroupCoverResponseDto> {
    // 1. 그룹 존재 확인 및 멤버 여부 확인
    const member = await this.groupMemberRepo.findOne({
      where: { groupId, userId },
      relations: ['group'],
    });

    if (!member) {
      const groupExists = await this.groupRepo.exists({
        where: { id: groupId },
      });
      if (!groupExists) {
        throw new NotFoundException('존재하지 않는 그룹입니다.');
      }
      throw new ForbiddenException('그룹 멤버가 아닙니다.');
    }

    // 2. 게시글 존재 및 그룹 소속 확인
    const post = await this.postRepo.findOne({
      where: { id: sourcePostId },
    });

    if (!post) {
      throw new NotFoundException('존재하지 않는 게시글입니다.');
    }

    if (post.groupId !== groupId) {
      throw new BadRequestException('해당 그룹의 게시글이 아닙니다.');
    }

    // 3. Asset 존재 및 게시글 내 포함 여부 확인 (Block 이미지인지)
    const postMedia = await this.postMediaRepo.findOne({
      where: {
        postId: sourcePostId,
        mediaId: assetId,
        kind: PostMediaKind.BLOCK,
      },
      relations: ['media'],
    });

    if (!postMedia) {
      throw new NotFoundException(
        '해당 게시글에 포함되지 않은 이미지이거나, 사용 가능한 이미지가 아닙니다.',
      );
    }

    // 4. 그룹 정보 업데이트
    await this.groupRepo.update(groupId, {
      coverMediaId: assetId,
      coverSourcePostId: sourcePostId,
    });

    // 5. 응답 반환
    return {
      groupId,
      cover: {
        assetId: postMedia.media.id,
        width: postMedia.media.width || 0,
        height: postMedia.media.height || 0,
        mimeType: postMedia.media.mimeType || 'application/octet-stream',
      },
      updatedAt: new Date(),
    };
  }

  /** 그룹 설정 정보 조회 */
  async getGroupSettings(
    userId: string,
    groupId: string,
  ): Promise<GetGroupSettingsResponseDto> {
    // 1. 그룹 존재 및 멤버 권한 확인
    const requesterMember = await this.groupMemberRepo.findOne({
      where: { groupId, userId },
    });

    if (!requesterMember) {
      const groupExists = await this.groupRepo.exists({
        where: { id: groupId },
      });
      if (!groupExists) {
        throw new NotFoundException('존재하지 않는 그룹입니다.');
      }
      throw new ForbiddenException('그룹 멤버가 아닙니다.');
    }

    // 2. 그룹 정보 조회 (커버 이미지 및 owner 포함)
    const group = await this.groupRepo.findOne({
      where: { id: groupId },
      relations: ['coverMedia', 'owner'],
    });

    if (!group) throw new NotFoundException('존재하지 않는 그룹입니다.');

    // 3. 전체 멤버 조회 (유저 정보 및 프로필 이미지 포함)
    const members = await this.groupMemberRepo.find({
      where: { groupId },
      relations: ['user', 'user.profileImage'],
      order: { joinedAt: 'ASC' },
    });

    // 4. 응답 구성
    const meMember = members.find((m) => m.userId === userId);
    if (!meMember) throw new ForbiddenException('그룹 멤버가 아닙니다.');

    const groupDto = {
      groupId: group.id,
      name: group.name,
      createdAt: group.createdAt,
      ownerUserId: group.owner.id,
      cover: group.coverMedia
        ? {
            assetId: group.coverMedia.id,
            sourcePostId: group.coverSourcePostId || '',
          }
        : null,
    };

    const memberDtos = members.map((m) => ({
      userId: m.user.id,
      name: m.user.nickname,
      profileImage: m.user.profileImage
        ? { assetId: m.user.profileImage.id }
        : null,
      role: m.role,
      nicknameInGroup: m.nicknameInGroup,
      joinedAt: m.joinedAt,
    }));

    const meDto = {
      userId: meMember.user.id,
      name: meMember.user.nickname,
      profileImage: meMember.user.profileImage
        ? { assetId: meMember.user.profileImage.id }
        : null,
      role: meMember.role,
      nicknameInGroup: meMember.nicknameInGroup,
      joinedAt: meMember.joinedAt,
    };

    return {
      group: groupDto,
      me: meDto,
      members: memberDtos,
    };
  }

  /** 그룹 내 내 설정 정보 조회 */
  async getGroupMemberMe(
    userId: string,
    groupId: string,
  ): Promise<GetGroupMemberMeResponseDto> {
    // 1. 멤버 조회 (유저 및 프로필 미디어 포함)
    const member = await this.groupMemberRepo.findOne({
      where: { groupId, userId },
      relations: ['user', 'profileMedia'],
    });

    // 2. 멤버가 없는 경우 예외 처리
    if (!member) {
      const groupExists = await this.groupRepo.exists({
        where: { id: groupId },
      });
      if (!groupExists) {
        throw new NotFoundException('존재하지 않는 그룹입니다.');
      }
      throw new ForbiddenException('그룹 멤버가 아닙니다.');
    }

    // 3. 응답 DTO 반환
    return {
      groupId: member.groupId,
      userId: member.userId,
      name: member.user.nickname,
      nicknameInGroup: member.nicknameInGroup || '',
      cover: member.profileMediaId
        ? {
            assetId: member.profileMediaId,
          }
        : null,
      role: member.role,
      updatedAt: member.updatedAt,
    };
  }

  /** 그룹 내 내 설정 정보 수정 */
  async updateGroupMemberMe(
    userId: string,
    groupId: string,
    dto: UpdateGroupMemberMeDto,
  ): Promise<GetGroupMemberMeResponseDto> {
    const { nicknameInGroup, profileMediaId } = dto;

    // 1. 변경 사항이 하나도 없으면 오류 반환
    if (!nicknameInGroup && !profileMediaId) {
      throw new BadRequestException('변경할 내용이 없습니다.');
    }

    // 2. 멤버 조회 (유저 포함)
    const member = await this.groupMemberRepo.findOne({
      where: { groupId, userId },
      relations: ['user'],
    });

    if (!member) {
      const groupExists = await this.groupRepo.exists({
        where: { id: groupId },
      });
      if (!groupExists) {
        throw new NotFoundException('존재하지 않는 그룹입니다.');
      }
      throw new ForbiddenException('그룹 멤버가 아닙니다.');
    }

    // 3. 닉네임 수정 시 유효성 검사 및 업데이트
    if (nicknameInGroup !== undefined) {
      if (nicknameInGroup === member.nicknameInGroup) {
        // 이미 동일한 닉네임이면 무시하거나 처리 (여기서는 전체 변경 없음을 체크했으므로 진행)
      } else {
        member.nicknameInGroup = this.validateGroupNickname(nicknameInGroup);
      }
    }

    // 4. 프로필 미디어 수정
    if (profileMediaId !== undefined) {
      member.profileMediaId = profileMediaId;
    }

    // 5. 저장
    await this.groupMemberRepo.save(member);

    // 6. 업데이트된 정보 재조회 (관련 필드 포함)
    return this.getGroupMemberMe(userId, groupId);
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
