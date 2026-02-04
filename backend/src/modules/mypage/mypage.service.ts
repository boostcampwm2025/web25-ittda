import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../user/entity/user.entity';
// import { Post } from '../post/entity/post.entity';
// import { Not } from 'typeorm';

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
   * 회원 탈퇴 (Hard Delete & Ownership Transfer)
   * @param userId 탈퇴 대상 사용자 ID
   */
  async withdraw(userId: string): Promise<void> {
    const result = await this.userRepo.softDelete({ id: userId });

    if (result.affected === 0) {
      throw new BadRequestException(
        '존재하지 않는 사용자이거나 이미 탈퇴 처리되었습니다.',
      );
    }
    //   await this.userRepo.manager.transaction(async (em) => {
    //     // 1. 사용자가 소유한 게시글(Post) 조회
    //     const ownedPosts = await em.find(Post, {
    //       where: { ownerUserId: userId },
    //     });

    //     for (const post of ownedPosts) {
    //       if (post.groupId) {
    //         // 그룹에 속한 게시글인 경우 소유권 이전 대상 탐색
    //         // 우선순위: Admin -> Editor 순으로 검색
    //         let targetMember = await em.findOne('GroupMember', {
    //           where: {
    //             groupId: post.groupId,
    //             userId: Not(userId),
    //             role: 'ADMIN', // Role 정의에 따라 문자열 또는 Enum 사용
    //           },
    //         });

    //         if (!targetMember) {
    //           targetMember = await em.findOne('GroupMember', {
    //             where: {
    //               groupId: post.groupId,
    //               userId: Not(userId),
    //               role: 'EDITOR',
    //             },
    //           });
    //         }

    //         if (targetMember) {
    //           // A. 소유권 이전 대상이 있는 경우
    //           post.ownerUserId = targetMember.userId as string;
    //           await em.save(post);
    //         } else {
    //           // B. Admin/Editor가 모두 없는 경우: 그룹 게시글 삭제
    //           await em.delete(Post, { id: post.id });
    //         }
    //       } else {
    //         // 그룹에 속하지 않은 개인 게시글은 즉시 삭제
    //         await em.delete(Post, { id: post.id });
    //       }
    //     }

    //     // 2. 기타 연관 데이터 삭제 (순서 유의)
    //     await em.softDelete('GroupMember', { userId });
    //     await em.softDelete('PostContributor', { userId }); // TODO: 삭제 대신 null 처리/탈퇴 표시로 변경?
    //     await em.softDelete('UserMonthCover', { userId });
    //     await em.softDelete('Template', { ownerUserId: userId });

    //     // 3. 사용자 본인 삭제 (TODO: soft delete로 변경?)
    //     const result = await em.softDelete(User, { id: userId });

    //     if (result.affected === 0) {
    //       throw new BadRequestException(
    //         '존재하지 않는 사용자이거나 이미 탈퇴 처리되었습니다.',
    //       );
    //     }
    //   });
    // }
  }
}
