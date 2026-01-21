import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PostController } from './post.controller';
import { PostDraftController } from './post-draft.controller';
import { PostDraftService } from './post-draft.service';
import { PostDraftGateway } from './post-draft.gateway';
import { PresenceService } from './collab/presence.service';
import { LockService } from './collab/lock.service';
import { PostService } from './post.service';

import { Post } from './entity/post.entity';
import { PostBlock } from './entity/post-block.entity';
import { PostContributor } from './entity/post-contributor.entity';
import { User } from '../user/user.entity';
import { Group } from '../group/entity/group.entity';
import { GroupMember } from '../group/entity/group_member.entity';
import { PostDraft } from './entity/post-draft.entity';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Post,
      PostBlock,
      PostContributor,
      PostDraft,
      User,
      Group,
      GroupMember,
    ]),
    AuthModule,
  ],
  controllers: [PostController, PostDraftController],
  providers: [
    PostService,
    PostDraftService,
    PostDraftGateway,
    PresenceService,
    LockService,
  ],
})
export class PostModule {}
