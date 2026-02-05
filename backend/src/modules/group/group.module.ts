import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { Group } from './entity/group.entity';
import { GroupMember } from './entity/group_member.entity';
import { GroupMonthCover } from './entity/group-month-cover.entity';

import { GroupController } from './controller/group.controller';
import { GroupManagementController } from './controller/group-management.controller';
import { GroupInviteController } from './controller/group-invite.controller';
import { GroupRecordController } from './controller/group-record.controller';
import { GroupActivityController } from './controller/group-activity.controller';

import { GroupService } from './service/group.service';
import { GroupRecordService } from './service/group-record.service';
import { GroupInviteService } from './service/group-invite.service';
import { GroupManagementService } from './service/group-management.service';
import { GroupActivityService } from './service/group-activity.service';

import { User } from '../user/entity/user.entity';
import { Post } from '../post/entity/post.entity';
import { PostBlock } from '../post/entity/post-block.entity';
import { PostMedia } from '../post/entity/post-media.entity';
import { GroupInvite } from './entity/group_invite.entity';
import { MediaAsset } from '../media/entity/media-asset.entity';
import { GroupActivityLog } from './entity/group-activity-log.entity';
import { GroupActivityActor } from './entity/group-activity-actor.entity';

import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Group,
      GroupMember,
      GroupMonthCover,
      User,
      GroupInvite,
      Post,
      PostBlock,
      PostMedia,
      MediaAsset,
      GroupActivityLog,
      GroupActivityActor,
    ]),
    AuthModule,
  ],
  providers: [
    GroupService,
    GroupRecordService,
    GroupInviteService,
    GroupManagementService,
    GroupActivityService,
  ],
  controllers: [
    GroupController,
    GroupRecordController,
    GroupManagementController,
    GroupInviteController,
    GroupActivityController,
  ],
  exports: [GroupService, GroupActivityService], // GroupRoleGuard에서 사용
})
export class GroupModule {}
