import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
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
    const user = await this.userRepo.findOneBy({ id: userId });
    if (!user) {
      throw new NotFoundException('해당 사용자를 찾을 수 없습니다.');
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

  /** 회원 탈퇴 (사용자 soft delete) */
  async withdraw(userId: string): Promise<void> {
    const result = await this.userRepo.softDelete({ id: userId });

    if (result.affected === 0) {
      throw new BadRequestException(
        '존재하지 않는 사용자이거나 이미 탈퇴 처리되었습니다.',
      );
    }
  }
}
