import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Headers,
  ForbiddenException,
  HttpCode,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ApiTags, ApiOperation, ApiHeader, ApiBody } from '@nestjs/swagger';
import { InquiryService } from './inquiry.service';
import { CreateInquiryDto } from './dto/create-inquiry.dto';

@ApiTags('inquiries')
@Controller({ version: '1' })
export class InquiryController {
  constructor(
    private readonly inquiryService: InquiryService,
    private readonly configService: ConfigService,
  ) {}

  // ─── Public ────────────────────────────────────────────────────────────────

  @Post('inquiries')
  @ApiOperation({ summary: '문의 접수' })
  @ApiBody({ type: CreateInquiryDto })
  async create(@Body() dto: CreateInquiryDto) {
    return this.inquiryService.create(dto);
  }

  // ─── Admin ─────────────────────────────────────────────────────────────────

  private checkAdminKey(key: string | undefined) {
    const adminKey = this.configService.get<string>('ADMIN_KEY');
    if (!adminKey || key !== adminKey) {
      throw new ForbiddenException('Invalid admin key');
    }
  }

  @Get('admin/inquiries')
  @ApiOperation({ summary: '[Admin] 문의 목록 조회' })
  @ApiHeader({ name: 'x-admin-key', required: true })
  async findAll(@Headers('x-admin-key') key?: string) {
    this.checkAdminKey(key);
    return this.inquiryService.findAll();
  }

  @Patch('admin/inquiries/:id/read')
  @ApiOperation({ summary: '[Admin] 문의 읽음 처리' })
  @ApiHeader({ name: 'x-admin-key', required: true })
  async markRead(
    @Param('id') id: string,
    @Headers('x-admin-key') key?: string,
  ) {
    this.checkAdminKey(key);
    return this.inquiryService.markRead(id);
  }

  @Delete('admin/inquiries/:id')
  @HttpCode(204)
  @ApiOperation({ summary: '[Admin] 문의 삭제' })
  @ApiHeader({ name: 'x-admin-key', required: true })
  async remove(@Param('id') id: string, @Headers('x-admin-key') key?: string) {
    this.checkAdminKey(key);
    await this.inquiryService.remove(id);
  }
}
