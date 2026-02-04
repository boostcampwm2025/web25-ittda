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
import { GroupActivityType } from '@/enums/group-activity-type.enum';
import { User } from '../../user/entity/user.entity';
import { GroupActivityService } from './group-activity.service';
import { resolveGroupNickname } from '../utils/group-nickname';
import * as crypto from 'crypto';

@Injectable()
export class GroupInviteService {
  constructor(
    @InjectRepository(GroupInvite)
    private readonly inviteRepo: Repository<GroupInvite>,

    @InjectRepository(GroupMember)
    private readonly groupMemberRepo: Repository<GroupMember>,

    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
    private readonly groupActivityService: GroupActivityService,
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
      nicknameInGroup: resolveGroupNickname(user.nickname),
    });

    const saved = await this.groupMemberRepo.save(member);
    await this.groupActivityService.recordActivity({
      groupId: invite.groupId,
      type: GroupActivityType.MEMBER_JOIN,
      actorIds: [userId],
      meta: { role: invite.permission },
    });
    return saved;
  }

  /** 초대 링크 삭제 */
  async deleteInvite(inviteId: string) {
    await this.inviteRepo.delete(inviteId);
  }
}
