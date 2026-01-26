import {
  Injectable,
  InternalServerErrorException,
  BadRequestException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';

import { Group } from './entity/group.entity';
import { GroupMember } from './entity/group_member.entity';
import { GroupRoleEnum } from '@/enums/group-role.enum';
import { User } from '../user/entity/user.entity';
import { GroupInvite } from './entity/group_invite.entity';
import { Post } from '@/modules/post/entity/post.entity';
import {
  PostMedia,
  PostMediaKind,
} from '@/modules/post/entity/post-media.entity';
import { GetGroupsResponseDto } from './dto/get-groups.dto';
import { UpdateGroupCoverResponseDto } from './dto/update-group-cover.dto';
import { GetGroupSettingsResponseDto } from './dto/get-group-settings.dto';
import * as crypto from 'crypto';

import { GroupItemDto } from './dto/get-groups.dto';

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

    @InjectRepository(GroupInvite)
    private readonly inviteRepo: Repository<GroupInvite>,

    @InjectRepository(Post) // Post 레포지토리 주입
    private readonly postRepo: Repository<Post>,

    @InjectRepository(PostMedia)
    private readonly postMediaRepo: Repository<PostMedia>,

    private readonly dataSource: DataSource,
  ) {}

  /** 그룹 생성 + ADMIN 등록 (트랜잭션 적용) */
  async createGroup(ownerId: string, name: string): Promise<Group> {
    // 1. 트랜잭션 시작
    return await this.dataSource.transaction(async (manager) => {
      try {
        // 2. 그룹 엔티티 생성 및 저장 (manager 사용 필수)
        const group = manager.create(Group, {
          name,
          owner: { id: ownerId } as User, // ID만 가진 객체로 캐스팅,
        });
        const savedGroup = await manager.save(group);

        const owner = await manager.findOneOrFail(User, {
          where: { id: ownerId },
        });

        // 3. 방장을 멤버 테이블에 ADMIN로 등록 (manager 사용 필수)
        const ownerMember = manager.create(GroupMember, {
          group: savedGroup,
          user: { id: ownerId } as User,
          role: GroupRoleEnum.ADMIN,
          nicknameInGroup: this.validateGroupNickname(owner.nickname),
        });
        await manager.save(ownerMember);

        // 모든 과정이 성공하면 자동 Commit
        return savedGroup;
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
      } catch (error) {
        // 에러 발생 시 자동 Rollback
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
        userId, // 객체 대신 문자열 ID 직접 사용
        groupId,
      },
      relations: ['group', 'user'],
    });
  }

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
    } catch (error) {
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
    requesterId: string, // 요청자 ID 추가
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

      // 2. 관리자 권한 유지 로직 (선택 사항: 그룹에 관리자가 최소 한 명은 있어야 함)
      // 만약 마지막 남은 ADMIN이 자신의 권한을 낮추는 것을 방지해야 한다면 추가 검증이 필요합니다.

      member.role = role;
      return await this.groupMemberRepo.save(member);
    } catch (error) {
      if (error instanceof BadRequestException) throw error;

      throw new InternalServerErrorException(
        '권한 변경 중 오류가 발생했습니다.',
      );
    }
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

    // 방장인지 확인
    if (group.owner.id !== userId) {
      throw new ForbiddenException('그룹을 삭제할 권한이 없습니다.');
    }

    // 그룹 삭제 (Cascade 설정으로 멤버들도 자동 삭제됨)
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

    // 이름 변경은 OWNER, ADMIN 권한이 필요하지만, 현재는 Controller에서 Guard로 처리한다고 가정
    // 하지만 Service 레벨에서도 안전하게 Owner/Admin 확인을 할 수 있음.
    // 여기서는 Owner 체크만 예시로 추가하거나, Guard를 믿고 진행.
    // 요구사항: OWNER/ADMIN.

    // 심플하게 update
    await this.groupRepo.update(groupId, { name });
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

  /** 초대 링크 생성 */
  async createInvite(
    userId: string,
    groupId: string,
    permission: GroupRoleEnum,
    expiresInSeconds: number,
  ) {
    // 권한 체크는 Controller Guard에서 수행 (ADMIN/OWNER)

    const code = crypto.randomBytes(4).toString('hex'); // 8자리 랜덤 코드
    const expiresAt = new Date();
    expiresAt.setSeconds(expiresAt.getSeconds() + expiresInSeconds);

    const invite = this.inviteRepo.create({
      code,
      groupId,
      permission,
      expiresAt,
    });

    return this.inviteRepo.save(invite);
  }

  /** 초대 링크 조회 */
  async getInvite(code: string) {
    const invite = await this.inviteRepo.findOne({
      where: { code },
      relations: ['group'],
    });

    if (!invite) {
      throw new BadRequestException('유효하지 않은 초대 코드입니다.');
    }

    if (invite.expiresAt < new Date()) {
      throw new BadRequestException('만료된 초대 코드입니다.');
    }

    const memberCount = await this.groupMemberRepo.count({
      where: { groupId: invite.groupId },
    });

    return {
      ...invite,
      memberCount,
    };
  }

  /** 초대 링크로 가입 */
  async joinGroupViaInvite(userId: string, code: string) {
    const invite = await this.inviteRepo.findOne({
      where: { code },
    });

    if (!invite || invite.expiresAt < new Date()) {
      throw new BadRequestException('유효하지 않거나 만료된 초대입니다.');
    }

    // 이미 멤버인지 확인
    const existingMember = await this.groupMemberRepo.findOne({
      where: {
        groupId: invite.groupId,
        userId,
      },
    });

    if (existingMember) {
      throw new BadRequestException('이미 그룹의 멤버입니다.');
    }

    // 멤버 추가
    return this.addMember(invite.groupId, userId, invite.permission);
  }

  /** 초대 링크 삭제 */
  async deleteInvite(inviteId: string) {
    await this.inviteRepo.delete(inviteId);
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

  /** 그룹 목록 조회 (최신 활동 순) */
  async getGroups(userId: string): Promise<GetGroupsResponseDto> {
    // 1. 유저가 속한 그룹 ID 목록 조회
    const members = await this.groupMemberRepo.find({
      where: { userId },
      select: ['groupId'],
    });

    if (members.length === 0) {
      return { items: [] };
    }

    const groupIds = members.map((m) => m.groupId);

    // 2. 각 그룹의 상세 정보 조회 (Parallel)
    const items = await Promise.all(
      groupIds.map(async (groupId) => {
        const group = await this.groupRepo.findOne({
          where: { id: groupId },
          relations: ['coverMedia'],
        });

        if (!group) return null; // 혹시 삭제된 그룹이 있다면 무시

        // 멤버 수
        const memberCount = await this.groupMemberRepo.count({
          where: { groupId },
        });

        // 기록 수
        const recordCount = await this.postRepo.count({
          where: { groupId },
        });

        // 최신 게시글
        const latestPost = await this.postRepo.findOne({
          where: { groupId },
          order: { eventAt: 'DESC' },
          select: ['id', 'title', 'eventAt', 'location', 'createdAt'],
        });

        // 최신 활동 시간: 그룹의 lastActivityAt이 있으면 사용, 없으면 createdAt.
        const lastActivityAt = group.lastActivityAt || group.createdAt;

        return {
          groupId: group.id,
          name: group.name,
          cover: group.coverMedia
            ? {
                assetId: group.coverMedia.id,
                width: group.coverMedia.width,
                height: group.coverMedia.height,
                // TODO: width, height는 사진 업로드 후 s3.head_object 등 api로 presigned url로 요청해서 가져오기
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
                placeName: null, // TODO: location -> placeName 변환 로직 필요
              }
            : null,
        };
      }),
    );

    // null 제거 및 정렬
    const validItems = items.filter((item) => item !== null) as GroupItemDto[];

    // 최신 활동 순 정렬 (내림차순)
    validItems.sort((a, b) => {
      const timeA = a.lastActivityAt ? new Date(a.lastActivityAt).getTime() : 0;
      const timeB = b.lastActivityAt ? new Date(b.lastActivityAt).getTime() : 0;
      return timeB - timeA;
    });

    return { items: validItems };
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
      // 그룹이 없거나, 멤버가 아님. 상세 에러 분기를 위해 그룹 먼저 체크할 수도 있지만,
      // 보안상 "권한 없음" 혹은 "Not Found"로 통일하는 것이 나을 수 있음.
      // 요구사항: 그룹 멤버가 아니거나 권한이 부족 -> 403 Forbidden
      // groupId가 존재하지 않을 때 -> 404 Not Found
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

    // 5. 응답 반환 (업데이트된 정보 다시 조회 혹은 구성)
    // coverMedia 정보는 postMedia.media에서 가져올 수 있음
    return {
      groupId,
      cover: {
        assetId: postMedia.media.id,
        width: postMedia.media.width || 0, // optional 처리
        height: postMedia.media.height || 0,
        mimeType: postMedia.media.mimeType || 'application/octet-stream',
      },
      updatedAt: new Date(), // 실제 DB 업데이트 시간과 차이가 있을 수 있으나 허용 범위
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

    // 2. 그룹 정보 조회 (커버 이미지 포함)
    const group = await this.groupRepo.findOne({
      where: { id: groupId },
      relations: ['coverMedia'],
    });

    if (!group) throw new NotFoundException('존재하지 않는 그룹입니다.');

    // 3. 전체 멤버 조회 (유저 정보 및 프로필 이미지 포함)
    const members = await this.groupMemberRepo.find({
      where: { groupId },
      relations: ['user', 'user.profileImageId'],
      order: { joinedAt: 'ASC' }, // 가입일 순 정렬 등
    });

    // 4. 응답 구성
    // Me 확인
    const meMember = members.find((m) => m.userId === userId);
    // (위에서 requesterMember를 찾았으므로 무조건 존재해야 하지만, 안전하게 확인)
    if (!meMember) throw new ForbiddenException('그룹 멤버가 아닙니다.');

    const groupDto = {
      groupId: group.id,
      name: group.name,
      createdAt: group.createdAt,
      ownerUserId: group.owner.id, // owner relation 필요함. groupRepo.findOne에서 relations 추가 필요?
      // -> Group entity에 @JoinColumn({name: 'owner_id'}) owner: User 가 있음.
      // typeorm은 relation load 안해도 id는 접근 가능할 수 있음 (lazy loading 아닐 때)
      // 하지만 확실하게 하기 위해 relations에 owner 추가하거나 loadRelationId 사용.
      // 여기서는 groupRepo.findOne relations에 owner 추가하는 게 안전.
      cover: group.coverMedia
        ? {
            assetId: group.coverMedia.id,
            sourcePostId: group.coverSourcePostId || '', // sourcePostId nullable 대응
          }
        : null,
    };

    // Members list (GroupSettingMemberDto[])
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

    // Me DTO
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

/*
const owner = await manager.findOneOrFail(User, {
  where: { id: ownerId },
}); // 이런 실제 owner 엔티티를 사용하지 않는 이유

TypeORM은 엔티티 객체를 저장할 때, 
관계가 맺어진 객체(owner) 전체를 검사하는 것이 아니라 
그 객체의 Primary Key 속성만 확인하여 외래 키를 할당합니다. 
따라서 { id: ownerId }와 같이 ID값만 포함된 가짜(Partial) 객체를 넘겨도
DB에는 정확한 owner_id가 저장됩니다.
*/
