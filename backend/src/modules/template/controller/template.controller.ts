import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Query,
  Param,
  UseGuards,
  ParseUUIDPipe,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../auth/jwt/jwt.guard';
import { User } from '@/common/decorators/user.decorator';
import { TemplateService } from '../service/template.service';
import {
  CreateTemplateDto,
  UpdateTemplateDto,
  GetTemplatesQueryDto,
  TemplateResponseDto,
} from '../dto/template.dto';
import {
  ApiWrappedOkResponse,
  ApiWrappedCreatedResponse,
} from '@/common/swagger/api-wrapped-response.decorator';
import type { MyJwtPayload } from '../../auth/auth.type';

@ApiTags('templates')
@ApiBearerAuth('bearerAuth')
@UseGuards(JwtAuthGuard)
@Controller({ path: 'templates', version: '1' })
export class TemplateController {
  constructor(private readonly templateService: TemplateService) {}

  @Get()
  @ApiOperation({
    summary: '템플릿 목록 조회',
    description:
      'scope에 따라 시스템, 개인, 또는 그룹 템플릿 목록을 조회합니다.',
  })
  @ApiWrappedOkResponse({ type: TemplateResponseDto, isArray: true })
  async findAll(
    @User() user: MyJwtPayload,
    @Query() query: GetTemplatesQueryDto,
  ) {
    const data = await this.templateService.findAll(user.sub, query);
    return { data };
  }

  @Post()
  @ApiOperation({ summary: '템플릿 생성' })
  @ApiWrappedCreatedResponse({ type: TemplateResponseDto })
  async create(@User() user: MyJwtPayload, @Body() dto: CreateTemplateDto) {
    const data = await this.templateService.create(user.sub, dto);
    return { data };
  }

  @Patch(':templateId')
  @ApiOperation({ summary: '템플릿 수정' })
  @ApiWrappedOkResponse({ type: TemplateResponseDto })
  async update(
    @User() user: MyJwtPayload,
    @Param('templateId', ParseUUIDPipe) templateId: string,
    @Body() dto: UpdateTemplateDto,
  ) {
    const data = await this.templateService.update(user.sub, templateId, dto);
    return { data };
  }

  @Delete(':templateId')
  @ApiOperation({ summary: '템플릿 삭제' })
  @ApiWrappedOkResponse({ type: Boolean })
  async remove(
    @User() user: MyJwtPayload,
    @Param('templateId', ParseUUIDPipe) templateId: string,
  ) {
    await this.templateService.remove(user.sub, templateId);
    return { data: true };
  }
}
