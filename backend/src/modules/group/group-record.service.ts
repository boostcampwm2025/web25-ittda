import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { Group } from './entity/group.entity';
import { GroupMonthCover } from './entity/group-month-cover.entity';

@Injectable()
export class GroupRecordService {
  constructor(
    @InjectRepository(Group)
    private readonly groupRepo: Repository<Group>,

    @InjectRepository(GroupMonthCover)
    private readonly groupMonthCoverRepo: Repository<GroupMonthCover>,
  ) {}

  /**
   * 그룹 월별 커버 이미지 변경
   */
  async updateMonthCover(
    groupId: string,
    year: number,
    month: number,
    coverAssetId: string,
  ) {
    // 그룹 존재 확인
    const group = await this.groupRepo.findOne({
      where: { id: groupId },
    });

    if (!group) {
      throw new NotFoundException('그룹을 찾을 수 없습니다.');
    }

    // Upsert: 기존 커버가 있으면 업데이트, 없으면 생성
    const exist = await this.groupMonthCoverRepo.findOne({
      where: { groupId, year, month },
    });

    if (exist) {
      exist.coverAssetId = coverAssetId;
      await this.groupMonthCoverRepo.save(exist);
    } else {
      const newCover = this.groupMonthCoverRepo.create({
        groupId,
        year,
        month,
        coverAssetId,
      });
      await this.groupMonthCoverRepo.save(newCover);
    }

    return { coverAssetId };
  }
}
