// group-management.controller.ts: 멤버 추가/추방, 권한 수정, 그룹 나가기, 멤버 목록 조회, 커버 이미지 수정, 그룹 설정 조회
import {
  Controller,
  Get,
  Post,
  Body,
  UseGuards,
  Param,
  Patch,
  Delete,
} from '@nestjs/common';
import { GroupManagementService } from '../service/group-management.service';
import { JwtAuthGuard } from '../../auth/jwt/jwt.guard';
import { GroupRoleGuard } from '../guards/group-roles.guard';
import { GroupRoles } from '../guards/group-roles.decorator';
import { AddMemberDto } from '../dto/add-member.dto';
import {
  UpdateGroupCoverDto,
  UpdateGroupCoverResponseDto,
} from '../dto/update-group-cover.dto';
import { GetGroupSettingsResponseDto } from '../dto/get-group-settings.dto';
import { GetGroupMembersResponseDto } from '../dto/get-group-members.dto';
import { GetGroupMemberMeResponseDto } from '../dto/get-group-member-me.dto';
import { UpdateGroupMemberMeDto } from '../dto/update-group-member-me.dto';
import { GetGroupPermissionResponseDto } from '../dto/get-group-permission.dto';
import { User } from '@/common/decorators/user.decorator';
import type { MyJwtPayload } from '../../auth/auth.type';
import { GroupRoleEnum } from '@/enums/group-role.enum';
import {
  ApiTags,
  ApiOperation,
  ApiParam,
  ApiBody,
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
export class GroupManagementController {
  constructor(
    private readonly groupManagementService: GroupManagementService,
  ) {}

  @UseGuards(GroupRoleGuard)
  @GroupRoles(GroupRoleEnum.ADMIN)
  @Post(':groupId/members')
  @ApiOperation({
    summary: '멤버 추가',
    description: '관리자가 특정 유저를 그룹 멤버로 추가합니다.',
  })
  @ApiParam({ name: 'groupId', description: '그룹 ID' })
  @ApiWrappedOkResponse({ type: Object })
  addMember(@Param('groupId') groupId: string, @Body() dto: AddMemberDto) {
    return this.groupManagementService.addMember(groupId, dto.userId, dto.role);
  }

  @UseGuards(GroupRoleGuard)
  @GroupRoles(GroupRoleEnum.ADMIN)
  @Patch(':groupId/members/:userId/role')
  @ApiOperation({
    summary: '멤버 권한 수정',
    description: '관리자가 특정 멤버의 권한을 수정합니다.',
  })
  @ApiParam({ name: 'groupId', description: '그룹 ID' })
  @ApiParam({ name: 'userId', description: '멤버의 유저 ID' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        role: {
          type: 'string',
          enum: Object.values(GroupRoleEnum),
          example: GroupRoleEnum.VIEWER,
        },
      },
    },
  })
  @ApiWrappedOkResponse({ type: Object })
  async updateRole(
    @User() user: MyJwtPayload,
    @Param('groupId') groupId: string,
    @Param('userId') userId: string,
    @Body('role') newRole: GroupRoleEnum,
  ) {
    const requesterId = user.sub;

    return this.groupManagementService.updateMemberRole(
      requesterId,
      groupId,
      userId,
      newRole,
    );
  }

  @UseGuards(GroupRoleGuard)
  @GroupRoles(GroupRoleEnum.EDITOR)
  @Patch(':groupId/cover')
  @ApiOperation({
    summary: '그룹 커버 이미지 수정',
    description: '그룹의 커버 이미지를 특정 게시글의 이미지로 변경합니다.',
  })
  @ApiParam({ name: 'groupId', description: '그룹 ID' })
  @ApiBody({ type: UpdateGroupCoverDto })
  @ApiWrappedOkResponse({ type: UpdateGroupCoverResponseDto })
  async updateGroupCover(
    @User() user: MyJwtPayload,
    @Param('groupId') groupId: string,
    @Body() dto: UpdateGroupCoverDto,
  ) {
    return this.groupManagementService.updateGroupCover(
      user.sub,
      groupId,
      dto.assetId,
      dto.sourcePostId,
      dto.version,
    );
  }

  @UseGuards(GroupRoleGuard)
  @GroupRoles(GroupRoleEnum.VIEWER)
  @Get(':groupId/settings')
  @ApiOperation({
    summary: '그룹 정보 조회',
    description: '그룹의 기본 정보와 내 정보, 전체 멤버 목록을 조회합니다.',
  })
  @ApiParam({ name: 'groupId', description: '그룹 ID' })
  @ApiWrappedOkResponse({ type: GetGroupSettingsResponseDto })
  async getGroupSettings(
    @User() user: MyJwtPayload,
    @Param('groupId') groupId: string,
  ) {
    return this.groupManagementService.getGroupSettings(user.sub, groupId);
  }

  @UseGuards(GroupRoleGuard)
  @GroupRoles(GroupRoleEnum.VIEWER)
  @Get(':groupId/members/me')
  @ApiOperation({
    summary: '그룹 내 내 설정 조회',
    description:
      '특정 그룹 내에서의 내 설정(닉네임, 커버 이미지, 역할 등)을 조회합니다.',
  })
  @ApiParam({ name: 'groupId', description: '그룹 ID' })
  @ApiWrappedOkResponse({ type: GetGroupMemberMeResponseDto })
  async getGroupMemberMe(
    @User() user: MyJwtPayload,
    @Param('groupId') groupId: string,
  ): Promise<GetGroupMemberMeResponseDto> {
    return this.groupManagementService.getGroupMemberMe(user.sub, groupId);
  }

  @Get(':groupId/members/me/role')
  @ApiOperation({
    summary: '그룹 내 내 권한(role) 조회',
    description: '특정 그룹에서의 내 권한(role)만 조회합니다.',
  })
  @ApiParam({ name: 'groupId', description: '그룹 ID' })
  @ApiWrappedOkResponse({ type: GetGroupPermissionResponseDto })
  async getGroupPermission(
    @User() user: MyJwtPayload,
    @Param('groupId') groupId: string,
  ): Promise<GetGroupPermissionResponseDto> {
    return this.groupManagementService.getGroupPermission(user.sub, groupId);
  }

  @UseGuards(GroupRoleGuard)
  @GroupRoles(GroupRoleEnum.VIEWER)
  @Patch(':groupId/members/me')
  @ApiOperation({
    summary: '그룹 내 내 설정 수정',
    description: '그룹 내에서 사용하는 닉네임과 프로필 이미지를 수정합니다.',
  })
  @ApiParam({ name: 'groupId', description: '그룹 ID' })
  @ApiBody({ type: UpdateGroupMemberMeDto })
  @ApiWrappedOkResponse({ type: GetGroupMemberMeResponseDto })
  async updateGroupMemberMe(
    @User() user: MyJwtPayload,
    @Param('groupId') groupId: string,
    @Body() dto: UpdateGroupMemberMeDto,
  ): Promise<GetGroupMemberMeResponseDto> {
    return this.groupManagementService.updateGroupMemberMe(
      user.sub,
      groupId,
      dto,
    );
  }

  @UseGuards(GroupRoleGuard)
  @GroupRoles(GroupRoleEnum.VIEWER)
  @Delete(':groupId/members/me')
  @ApiOperation({
    summary: '그룹 나가기',
    description: '사용자 본인이 그룹에서 탈퇴합니다.',
  })
  @ApiParam({ name: 'groupId', description: '그룹 ID' })
  @ApiWrappedOkResponse({ type: Object })
  async leaveGroup(
    @User() user: MyJwtPayload,
    @Param('groupId') groupId: string,
  ) {
    return this.groupManagementService.leaveGroup(user.sub, groupId);
  }

  @UseGuards(GroupRoleGuard)
  @GroupRoles(GroupRoleEnum.ADMIN)
  @Delete(':groupId/members/:memberId')
  @ApiOperation({
    summary: '멤버 추방',
    description: '관리자가 특정 멤버를 그룹에서 추방합니다.',
  })
  @ApiParam({ name: 'groupId', description: '그룹 ID' })
  @ApiParam({ name: 'memberId', description: '추방할 멤버의 ID' })
  @ApiWrappedOkResponse({ type: Object })
  async removeMember(
    @User() user: MyJwtPayload,
    @Param('groupId') groupId: string,
    @Param('memberId') memberId: string,
  ) {
    return this.groupManagementService.removeMember(
      user.sub,
      groupId,
      memberId,
    );
  }

  @Get(':groupId/current-members')
  @ApiOperation({
    summary: '그룹 멤버 목록 조회',
    description: '현재 그룹에 속한 멤버들의 정보를 조회합니다.',
  })
  @ApiParam({ name: 'groupId', description: '그룹 ID' })
  @ApiWrappedOkResponse({ type: GetGroupMembersResponseDto })
  async getGroupMembers(
    @Param('groupId') groupId: string,
  ): Promise<GetGroupMembersResponseDto> {
    return this.groupManagementService.getGroupMembers(groupId);
  }
}
