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
import { Post } from '../post/entity/post.entity';
import { PostBlock } from '../post/entity/post-block.entity';
import { PostMedia } from '../post/entity/post-media.entity';
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
      Post,
      PostBlock,
      PostMedia,
    ]),
    AuthModule,
  ],
  providers: [GroupService, GroupRecordService],
  controllers: [GroupController, GroupRecordController],
  exports: [GroupService], // GroupRoleGuard에서 사용
})
export class GroupModule {}
