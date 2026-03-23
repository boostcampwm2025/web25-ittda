import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Inquiry } from './entity/inquiry.entity';
import { CreateInquiryDto } from './dto/create-inquiry.dto';

@Injectable()
export class InquiryService {
  constructor(
    @InjectRepository(Inquiry)
    private readonly inquiryRepository: Repository<Inquiry>,
  ) {}

  async create(dto: CreateInquiryDto): Promise<Inquiry> {
    const inquiry = this.inquiryRepository.create(dto);
    return this.inquiryRepository.save(inquiry);
  }

  async findAll(): Promise<Inquiry[]> {
    return this.inquiryRepository.find({
      order: { createdAt: 'DESC' },
    });
  }

  async markRead(id: string): Promise<Inquiry> {
    const inquiry = await this.inquiryRepository.findOneBy({ id });
    if (!inquiry) throw new NotFoundException('Inquiry not found');
    inquiry.isRead = true;
    return this.inquiryRepository.save(inquiry);
  }

  async remove(id: string): Promise<void> {
    await this.inquiryRepository.delete(id);
  }
}
