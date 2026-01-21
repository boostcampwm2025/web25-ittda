import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { Group } from './entity/group.entity';
import { GroupMember } from './entity/group_member.entity';
import { GroupMonthCover } from './entity/group-month-cover.entity';
import { GroupService } from './group.service';
import { GroupController } from './group.controller';
import { GroupRecordService } from './group-record.service';
import { GroupRecordController } from './group-record.controller';
import { User } from '../user/entity/user.entity';

import { GroupInvite } from './entity/group_invite.entity';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Group,
      GroupMember,
      GroupMonthCover,
      User,
      GroupInvite,
    ]),
    AuthModule,
  ],
  providers: [GroupService, GroupRecordService],
  controllers: [GroupController, GroupRecordController],
  exports: [GroupService], // GroupRoleGuard에서 사용
})
export class GroupModule {}
