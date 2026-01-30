import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Template } from './entity/template.entity';
import { GroupMember } from '../group/entity/group_member.entity';
import { TemplateService } from './service/template.service';
import { TemplateController } from './controller/template.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Template, GroupMember])],
  controllers: [TemplateController],
  providers: [TemplateService],
  exports: [TemplateService],
})
export class TemplateModule {}
