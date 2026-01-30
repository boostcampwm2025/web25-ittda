import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../user/entity/user.entity';

// Mypage Service에서 기능 구현
@Injectable()
export class MyPageService {
  constructor(
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
  ) {}

  async findOne(userId: string): Promise<User> {
    return this.userRepo.findOneByOrFail({ id: userId });
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

  /** 회원 탈퇴 (Hard Delete & Cascade) */
  async withdraw(userId: string): Promise<void> {
    await this.userRepo.manager.transaction(async (em) => {
      // 1. 그룹 멤버십 삭제
      await em.delete('GroupMember', { userId });

      // 2. 기여자 정보 삭제
      await em.delete('PostContributor', { userId });

      // 3. 월별 커버 삭제
      await em.delete('UserMonthCover', { userId });

      // 4. 작성한 게시글 삭제 (PostMedia, PostBlock 등은 DB Cascade 설정을 따름)
      // 만약 DB Cascade가 없으면 에러가 날 수 있으나, 일반적으로 Post 삭제 시 관련 데이터 삭제됨을 가정
      await em.delete('Post', { ownerUserId: userId });

      // 5. 미디어 에셋 삭제 (프로필 이미지 등)
      // 주의: 미디어가 널리 쓰이고 있다면 Set Null 처리가 나을 수도 있을 것 같음
      await em.delete('MediaAsset', { ownerUserId: userId });

      // 6. Template 삭제 (옵션)
      await em.delete('Template', { ownerUserId: userId });

      // 7. 사용자 삭제
      const result = await em.delete(User, { id: userId });

      if (result.affected === 0) {
        throw new BadRequestException(
          '존재하지 않는 사용자이거나 이미 탈퇴 처리되었습니다.',
        );
      }
    });
  }
}
