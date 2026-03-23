import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Inquiry } from './entity/inquiry.entity';
import { InquiryService } from './inquiry.service';
import { InquiryController } from './inquiry.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Inquiry])],
  controllers: [InquiryController],
  providers: [InquiryService],
})
export class InquiryModule {}
