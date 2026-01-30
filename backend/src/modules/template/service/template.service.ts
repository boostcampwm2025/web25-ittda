import {
  Injectable,
  ForbiddenException,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Template } from '../entity/template.entity';
import { TemplateScope } from '@/enums/template-scope.enum';
import { GroupMember } from '../../group/entity/group_member.entity';
import { GroupRoleEnum } from '@/enums/group-role.enum';
import {
  CreateTemplateDto,
  UpdateTemplateDto,
  GetTemplatesQueryDto,
} from '../dto/template.dto';

@Injectable()
export class TemplateService {
  constructor(
    @InjectRepository(Template)
    private readonly templateRepo: Repository<Template>,

    @InjectRepository(GroupMember)
    private readonly groupMemberRepo: Repository<GroupMember>,
  ) {}

  /**
   * 템플릿 목록 조회
   */
  async findAll(
    userId: string,
    query: GetTemplatesQueryDto,
  ): Promise<Template[]> {
    const { scope, groupId } = query;

    if (scope === TemplateScope.SYSTEM) {
      return this.templateRepo.find({
        where: { scope: TemplateScope.SYSTEM },
        order: { createdAt: 'ASC' },
      });
    }

    if (scope === TemplateScope.ME) {
      return this.templateRepo.find({
        where: { scope: TemplateScope.ME, ownerUserId: userId },
        order: { createdAt: 'DESC' },
      });
    }

    if (scope === TemplateScope.GROUP) {
      if (!groupId) {
        throw new BadRequestException('groupId가 필요합니다.');
      }

      // 그룹 멤버인지 확인
      const member = await this.groupMemberRepo.findOne({
        where: { groupId, userId },
      });

      if (!member) {
        throw new ForbiddenException('해당 그룹의 멤버가 아닙니다.');
      }

      return this.templateRepo.find({
        where: { scope: TemplateScope.GROUP, groupId },
        order: { createdAt: 'DESC' },
      });
    }

    return [];
  }

  /**
   * 템플릿 생성
   */
  async create(userId: string, dto: CreateTemplateDto): Promise<Template> {
    const { scope, groupId } = dto;

    // if (scope === TemplateScope.SYSTEM) {
    //   // TODO: 시스템 템플릿 생성 권한 체크 (예: 관리자만 가능)
    //   // 현재는 간단히 허용하거나 나중에 추가
    // }

    if (scope === TemplateScope.GROUP) {
      if (!groupId) {
        throw new BadRequestException('groupId가 필요합니다.');
      }

      // 관리자/편집자 권한 체크
      const member = await this.groupMemberRepo.findOne({
        where: { groupId, userId },
      });

      if (
        !member ||
        (member.role !== GroupRoleEnum.ADMIN &&
          member.role !== GroupRoleEnum.EDITOR)
      ) {
        throw new ForbiddenException('그룹 템플릿을 생성할 권한이 없습니다.');
      }
    }

    const template = this.templateRepo.create({
      ...dto,
      ownerUserId: scope === TemplateScope.ME ? userId : null,
      groupId: scope === TemplateScope.GROUP ? groupId : null,
    });

    return this.templateRepo.save(template);
  }

  /**
   * 템플릿 수정
   */
  async update(
    userId: string,
    templateId: string,
    dto: UpdateTemplateDto,
  ): Promise<Template> {
    const template = await this.templateRepo.findOne({
      where: { id: templateId },
    });

    if (!template) {
      throw new NotFoundException('템플릿을 찾을 수 없습니다.');
    }

    // 권한 체크
    await this.ensurePermission(userId, template);

    Object.assign(template, dto);
    // dto가 template의 일부분만 가지고 있다면, 그 부분만 수정되고 나머지는 유지
    return this.templateRepo.save(template);
  }

  /**
   * 템플릿 삭제
   */
  async remove(userId: string, templateId: string): Promise<void> {
    const template = await this.templateRepo.findOne({
      where: { id: templateId },
    });

    if (!template) {
      throw new NotFoundException('템플릿을 찾을 수 없습니다.');
    }

    // 권한 체크
    await this.ensurePermission(userId, template);

    await this.templateRepo.softDelete(templateId);
  }

  /**
   * 권한 확인 유틸리티
   */
  private async ensurePermission(
    userId: string,
    template: Template,
  ): Promise<void> {
    if (template.scope === TemplateScope.ME) {
      if (template.ownerUserId !== userId) {
        throw new ForbiddenException(
          '해당 템플릿을 수정/삭제할 권한이 없습니다.',
        );
      }
    } else if (template.scope === TemplateScope.GROUP) {
      const member = await this.groupMemberRepo.findOne({
        where: { groupId: template.groupId as string, userId },
      });

      if (
        !member ||
        (member.role !== GroupRoleEnum.ADMIN &&
          member.role !== GroupRoleEnum.EDITOR)
      ) {
        throw new ForbiddenException(
          '그룹 템플릿을 수정/삭제할 권한이 없습니다.',
        );
      }
    } else if (template.scope === TemplateScope.SYSTEM) {
      // TODO: 시스템 템플릿 수정 권한 체크
      throw new ForbiddenException('시스템 템플릿은 수정/삭제할 수 없습니다.');
    }
  }
}
