// group-invite.service.ts: 초대 링크 관련 비즈니스 로직
import {
  Injectable,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { GroupInvite } from '../entity/group_invite.entity';
import { GroupMember } from '../entity/group_member.entity';
import { GroupRoleEnum } from '@/enums/group-role.enum';
import { User } from '../../user/entity/user.entity';
import * as crypto from 'crypto';

const GROUP_NICKNAME_REGEX = /^[a-zA-Z0-9가-힣 ]+$/;

@Injectable()
export class GroupInviteService {
  constructor(
    @InjectRepository(GroupInvite)
    private readonly inviteRepo: Repository<GroupInvite>,

    @InjectRepository(GroupMember)
    private readonly groupMemberRepo: Repository<GroupMember>,

    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
  ) {}

  /** 초대 링크 생성 */
  async createInvite(
    userId: string,
    groupId: string,
    permission: GroupRoleEnum,
    expiresInSeconds: number,
  ) {
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
      // 이미 멤버라면 에러 던짐
      throw new ConflictException('이미 그룹에 가입된 사용자입니다.');
    }

    // 멤버 추가
    const user = await this.userRepo.findOneByOrFail({ id: userId });

    const member = this.groupMemberRepo.create({
      group: { id: invite.groupId },
      user,
      role: invite.permission,
      nicknameInGroup: this.validateGroupNickname(user.nickname),
    });

    return this.groupMemberRepo.save(member);
  }

  /** 초대 링크 삭제 */
  async deleteInvite(groupId: string, inviteId: string) {
    await this.inviteRepo.delete({
      id: inviteId,
      groupId: groupId,
    });
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
