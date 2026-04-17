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

// Mypage Service에서 기능 구현
@Injectable()
export class MyPageService {
  constructor(
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
    @InjectRepository(RefreshToken)
    private readonly refreshTokenRepo: Repository<RefreshToken>,
    @InjectRepository(Group)
    private readonly groupRepo: Repository<Group>,
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
      const postRepo = manager.getRepository(Post);
      const refreshTokenRepo = manager.getRepository(RefreshToken);
      const userRepo = manager.getRepository(User);

      const ownedGroups = await groupRepo.find({
        where: { owner: { id: userId } },
        select: {
          id: true,
          name: true,
        },
      });

      if (ownedGroups.length > 0) {
        let groupNames = ownedGroups
          .map((group) => `"${group.name}"`)
          .join(', ');
        if (ownedGroups.length === 1) {
          groupNames = `그룹 "${ownedGroups[0].name}"`;
        } else {
          groupNames = `그룹들 ${groupNames}`;
        }

        throw new BadRequestException(
          `사용자가 소유한 ${groupNames}이 존재합니다. 그룹을 삭제하거나 소유권을 이전한 후 다시 시도해주세요.`,
        );
      }

      await postRepo.update({ ownerUserId: userId }, { shareToken: null });
      await refreshTokenRepo.update({ userId }, { revoked: true });

      const result = await userRepo.softDelete({ id: userId });

      if (result.affected === 0) {
        throw new BadRequestException(
          '존재하지 않는 사용자이거나 이미 탈퇴 처리되었습니다.',
        );
      }
    });
  }
}
