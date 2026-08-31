import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Announcement } from './entity/announcement.entity';
import { CreateAnnouncementDto } from './dto/create-announcement.dto';
import { UpdateAnnouncementDto } from './dto/update-announcement.dto';

@Injectable()
export class AnnouncementService {
  constructor(
    @InjectRepository(Announcement)
    private readonly announcementRepo: Repository<Announcement>,
  ) {}

  /**
   * 현재 활성화된 공지 1개 반환
   * - isActive = true
   * - startAt이 있으면 현재 시각 이후
   * - endAt이 있으면 현재 시각 이전
   */
  async getActive(): Promise<Announcement | null> {
    const now = new Date();

    return this.announcementRepo
      .createQueryBuilder('a')
      .where('a.is_active = true')
      .andWhere('(a.start_at IS NULL OR a.start_at <= :now)', { now })
      .andWhere('(a.end_at IS NULL OR a.end_at >= :now)', { now })
      .orderBy('a.created_at', 'DESC')
      .getOne();
  }

  findAll(): Promise<Announcement[]> {
    return this.announcementRepo.find({ order: { createdAt: 'DESC' } });
  }

  async create(dto: CreateAnnouncementDto): Promise<Announcement> {
    // isActive로 생성하면 기존 활성 공지 비활성화
    if (dto.isActive) {
      await this.announcementRepo.update(
        { isActive: true },
        { isActive: false },
      );
    }

    const entity = this.announcementRepo.create({
      title: dto.title,
      content: dto.content ?? null,
      imageUrl: dto.imageUrl ?? null,
      isActive: dto.isActive ?? false,
      startAt: dto.startAt ? new Date(dto.startAt) : null,
      endAt: dto.endAt ? new Date(dto.endAt) : null,
    });

    return this.announcementRepo.save(entity);
  }

  async update(id: string, dto: UpdateAnnouncementDto): Promise<Announcement> {
    const announcement = await this.announcementRepo.findOne({ where: { id } });

    if (!announcement) {
      throw new NotFoundException('공지사항을 찾을 수 없습니다.');
    }

    // isActive를 true로 변경하면 기존 활성 공지 비활성화
    if (dto.isActive === true && !announcement.isActive) {
      await this.announcementRepo.update(
        { isActive: true },
        { isActive: false },
      );
    }

    Object.assign(announcement, {
      ...(dto.title !== undefined && { title: dto.title }),
      ...(dto.content !== undefined && { content: dto.content }),
      ...(dto.imageUrl !== undefined && { imageUrl: dto.imageUrl }),
      ...(dto.isActive !== undefined && { isActive: dto.isActive }),
      ...(dto.startAt !== undefined && {
        startAt: dto.startAt ? new Date(dto.startAt) : null,
      }),
      ...(dto.endAt !== undefined && {
        endAt: dto.endAt ? new Date(dto.endAt) : null,
      }),
    });

    return this.announcementRepo.save(announcement);
  }

  async remove(id: string): Promise<void> {
    const result = await this.announcementRepo.delete({ id });

    if (result.affected === 0) {
      throw new NotFoundException('공지사항을 찾을 수 없습니다.');
    }
  }
}
