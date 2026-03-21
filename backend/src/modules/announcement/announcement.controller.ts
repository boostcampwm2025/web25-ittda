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
import { AnnouncementService } from './announcement.service';
import { CreateAnnouncementDto } from './dto/create-announcement.dto';
import { UpdateAnnouncementDto } from './dto/update-announcement.dto';

@ApiTags('announcements')
@Controller({ version: '1' })
export class AnnouncementController {
  constructor(
    private readonly announcementService: AnnouncementService,
    private readonly configService: ConfigService,
  ) {}

  // ─── Public ────────────────────────────────────────────────────────────────

  @Get('announcements/active')
  @ApiOperation({
    summary: '활성 공지사항 조회',
    description:
      '현재 활성화된 공지사항 1건을 반환합니다. 없으면 null을 반환합니다.',
  })
  async getActive() {
    return this.announcementService.getActive();
  }

  @Get('announcements')
  @ApiOperation({ summary: '공지사항 전체 목록 (공개)' })
  async findAllPublic() {
    return this.announcementService.findAll();
  }

  // ─── Admin ─────────────────────────────────────────────────────────────────

  private checkAdminKey(key: string | undefined) {
    const adminKey = this.configService.get<string>('ADMIN_KEY');
    if (!adminKey || key !== adminKey) {
      throw new ForbiddenException('Invalid admin key');
    }
  }

  @Get('admin/announcements')
  @ApiOperation({ summary: '[Admin] 공지사항 전체 목록' })
  @ApiHeader({ name: 'x-admin-key', required: true })
  async findAll(@Headers('x-admin-key') key?: string) {
    this.checkAdminKey(key);
    return this.announcementService.findAll();
  }

  @Post('admin/announcements')
  @ApiOperation({ summary: '[Admin] 공지사항 생성' })
  @ApiHeader({ name: 'x-admin-key', required: true })
  @ApiBody({ type: CreateAnnouncementDto })
  async create(
    @Headers('x-admin-key') key: string,
    @Body() dto: CreateAnnouncementDto,
  ) {
    this.checkAdminKey(key);
    return this.announcementService.create(dto);
  }

  @Patch('admin/announcements/:id')
  @ApiOperation({ summary: '[Admin] 공지사항 수정 (활성화 포함)' })
  @ApiHeader({ name: 'x-admin-key', required: true })
  @ApiBody({ type: UpdateAnnouncementDto })
  async update(
    @Param('id') id: string,
    @Headers('x-admin-key') key: string,
    @Body() dto: UpdateAnnouncementDto,
  ) {
    this.checkAdminKey(key);
    return this.announcementService.update(id, dto);
  }

  @Delete('admin/announcements/:id')
  @HttpCode(204)
  @ApiOperation({ summary: '[Admin] 공지사항 삭제' })
  @ApiHeader({ name: 'x-admin-key', required: true })
  async remove(@Param('id') id: string, @Headers('x-admin-key') key: string) {
    this.checkAdminKey(key);
    await this.announcementService.remove(id);
  }
}
