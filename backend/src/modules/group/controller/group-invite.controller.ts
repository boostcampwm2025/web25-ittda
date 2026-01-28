// group-invite.controller.ts: 초대 링크 생성, 조회, 가입, 삭제
import {
  Controller,
  Get,
  Post,
  UseGuards,
  Param,
  Delete,
  Body,
} from '@nestjs/common';
import { GroupInviteService } from '../service/group-invite.service';
import { JwtAuthGuard } from '../../auth/jwt/jwt.guard';
import { GroupRoleGuard } from '../guards/group-roles.guard';
import { GroupRoles } from '../guards/group-roles.decorator';
import { CreateInviteDto } from '../dto/create-invite.dto';
import { User } from '@/common/decorators/user.decorator';
import type { MyJwtPayload } from '../../auth/auth.type';
import { GroupRoleEnum } from '@/enums/group-role.enum';
import {
  ApiTags,
  ApiOperation,
  ApiParam,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { ApiWrappedOkResponse } from '@/common/swagger/api-wrapped-response.decorator';

@ApiTags('groups')
@ApiBearerAuth('bearerAuth')
@Controller({
  path: 'groups',
  version: '1',
})
@UseGuards(JwtAuthGuard)
export class GroupInviteController {
  constructor(private readonly groupInviteService: GroupInviteService) {}

  @UseGuards(GroupRoleGuard)
  @GroupRoles(GroupRoleEnum.ADMIN)
  @Post(':groupId/invites')
  @ApiOperation({
    summary: '초대 링크 생성',
    description: '관리자가 그룹에 초대할 수 있는 고유 링크 코드를 생성합니다.',
  })
  @ApiParam({ name: 'groupId', description: '그룹 ID' })
  @ApiWrappedOkResponse({ type: Object })
  async createInvite(
    @User() user: MyJwtPayload,
    @Param('groupId') groupId: string,
    @Body() dto: CreateInviteDto,
  ) {
    return this.groupInviteService.createInvite(
      user.sub,
      groupId,
      dto.permission,
      dto.expiresInSeconds,
    );
  }

  @Get('invites/:code')
  @ApiOperation({
    summary: '초대 코드 정보 조회',
    description: '초대 코드의 유효성과 대상 그룹 정보를 확인합니다.',
  })
  @ApiParam({ name: 'code', description: '초대 코드' })
  @ApiWrappedOkResponse({ type: Object })
  async getInvite(@Param('code') code: string) {
    return this.groupInviteService.getInvite(code);
  }

  @Post('invites/:code/join')
  @ApiOperation({
    summary: '초대 코드로 그룹 가입',
    description: '로그인한 사용자가 초대 코드를 사용하여 그룹에 가입합니다.',
  })
  @ApiParam({ name: 'code', description: '초대 코드' })
  @ApiWrappedOkResponse({ type: Object })
  async joinGroupViaInvite(
    @User() user: MyJwtPayload,
    @Param('code') code: string,
  ) {
    return this.groupInviteService.joinGroupViaInvite(user.sub, code);
  }

  @UseGuards(GroupRoleGuard)
  @GroupRoles(GroupRoleEnum.ADMIN)
  @Delete(':groupId/invites/:inviteId')
  @ApiOperation({
    summary: '초대 링크 삭제',
    description: '관리자가 생성된 초대 링크를 비활성화(삭제)합니다.',
  })
  @ApiParam({ name: 'groupId', description: '그룹 ID' })
  @ApiParam({ name: 'inviteId', description: '초대 ID' })
  @ApiWrappedOkResponse({ type: Object })
  async deleteInvite(
    @Param('groupId') groupId: string,
    @Param('inviteId') inviteId: string,
  ) {
    await this.groupInviteService.deleteInvite(inviteId);
    return;
  }
}
