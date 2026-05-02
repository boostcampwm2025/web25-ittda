import {
  Injectable,
  BadRequestException,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../user/entity/user.entity';
import { RefreshToken } from '../auth/refresh_token/refresh_token.entity';
import { Group } from '../group/entity/group.entity';
import { Post } from '../post/entity/post.entity';
import { GroupMember } from '../group/entity/group_member.entity';
import { GroupRoleEnum } from '@/enums/group-role.enum';
import { pickNextGroupAdmin } from '../group/utils/group-role-priority';

// Mypage Service에서 기능 구현
@Injectable()
export class MyPageService {
  constructor(
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
  ) {}

  async findOne(userId: string): Promise<User> {
    const user = await this.userRepo.findOneBy({ id: userId });
    if (!user) {
      throw new UnauthorizedException('사용자를 찾을 수 없습니다.');
    }
    return user;
  }

  // Record<string, any> 대신 unknown 권장
  async updateSettings(
    userId: string,
    settings: Record<string, unknown>,
  ): Promise<User> {
    const user = await this.findOne(userId);
    user.settings = { ...user.settings, ...settings };
    return this.userRepo.save(user);
  }

  /** 내 프로필 수정 (닉네임, 프로필 이미지) */
  async updateProfile(
    userId: string,
    nickname?: string,
    profileImageId?: string,
  ): Promise<User> {
    // 1. 닉네임 변경 시 유효성 검사
    if (nickname) {
      if (nickname.length < 2 || nickname.length > 50) {
        throw new BadRequestException(
          '닉네임은 최소 2자 이상, 최대 50자까지 가능합니다.',
        );
      }
      if (!/^[a-zA-Z가-힣0-9]+$/.test(nickname)) {
        throw new BadRequestException(
          '닉네임은 한글, 영어, 숫자만 입력 가능합니다.',
        );
      }
    }

    // 2. 부분 업데이트 수행
    const updateData: Partial<User> = {
      ...(nickname && { nickname }),
      ...(profileImageId && { profileImageId }),
    };

    if (Object.keys(updateData).length > 0) {
      await this.userRepo.update(userId, updateData);
    }

    // 3. 수정된 사용자 정보 반환 (no-unsafe-return 방지)
    return this.findOne(userId);
  }

  /**
   * 회원 탈퇴
   * @param userId 탈퇴 대상 사용자 ID
   */
  async withdraw(userId: string): Promise<void> {
    await this.userRepo.manager.transaction(async (manager) => {
      const groupRepo = manager.getRepository(Group);
      const groupMemberRepo = manager.getRepository(GroupMember);
      const postRepo = manager.getRepository(Post);
      const refreshTokenRepo = manager.getRepository(RefreshToken);
      const userRepo = manager.getRepository(User);

      const user = await userRepo
        .createQueryBuilder('u')
        .where('u.id = :userId', { userId })
        .setLock('pessimistic_write')
        .getOne();

      if (!user) {
        throw new BadRequestException(
          '존재하지 않는 사용자이거나 이미 탈퇴 처리되었습니다.',
        );
      }

      const memberships = await groupMemberRepo
        .createQueryBuilder('gm')
        .where('gm.userId = :userId', { userId })
        .orderBy('gm.groupId', 'ASC')
        .setLock('pessimistic_write', undefined, ['gm'])
        .getMany();

      for (const membership of memberships) {
        if (membership.role !== GroupRoleEnum.ADMIN) {
          await groupMemberRepo.softDelete(membership.id);
          continue;
        }

        const groupMembers = await groupMemberRepo
          .createQueryBuilder('gm')
          .where('gm.groupId = :groupId', { groupId: membership.groupId })
          .orderBy('gm.joinedAt', 'ASC')
          .setLock('pessimistic_write', undefined, ['gm'])
          .getMany();

        const me = groupMembers.find(
          (groupMember) => groupMember.id === membership.id,
        );

        if (!me) {
          throw new BadRequestException('그룹 멤버가 아닙니다.');
        }

        const remainingMembers = groupMembers.filter(
          (groupMember) => groupMember.id !== me.id,
        );

        const remainingAdmins = remainingMembers.filter(
          (groupMember) => groupMember.role === GroupRoleEnum.ADMIN,
        );

        if (remainingAdmins.length > 0) {
          await groupMemberRepo.softDelete(me.id);
          continue;
        }

        if (remainingMembers.length === 0) {
          await groupRepo.delete(membership.groupId);
          continue;
        }

        const nextAdmin = pickNextGroupAdmin(remainingMembers);

        if (!nextAdmin) {
          throw new BadRequestException(
            '관리자 권한을 양도할 그룹 멤버를 찾을 수 없습니다.',
          );
        }

        nextAdmin.role = GroupRoleEnum.ADMIN;
        await groupMemberRepo.save(nextAdmin);
        await groupMemberRepo.softDelete(me.id);
      }

      await postRepo.update({ ownerUserId: userId }, { shareToken: null });
      await refreshTokenRepo.update({ userId }, { revoked: true });
      await userRepo.softDelete(userId);
    });
  }
}
