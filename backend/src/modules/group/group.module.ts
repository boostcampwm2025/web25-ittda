import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { Group } from './entity/group.entity';
import { GroupMember } from './entity/group_member.entity';
import { GroupService } from './group.service';
import { GroupController } from './group.controller';
import { User } from '../user/user.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Group, GroupMember, User])],
  providers: [GroupService],
  controllers: [GroupController],
  exports: [GroupService], // GroupRoleGuard에서 사용
})
export class GroupModule {}
