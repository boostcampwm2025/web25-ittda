import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PostController } from './post.controller';
import { PostDraftController } from './post-draft.controller';
import { PostDraftService } from './post-draft.service';
import { PostDraftGateway } from './post-draft.gateway';
import { PresenceService } from './collab/presence.service';
import { LockService } from './collab/lock.service';
import { DraftStateService } from './collab/draft-state.service';
import { PostService } from './post.service';
import { PostPublishService } from './post-publish.service';
import { PatchStreamService } from './collab/patch-stream.service';

import { Post } from './entity/post.entity';
import { PostBlock } from './entity/post-block.entity';
import { PostContributor } from './entity/post-contributor.entity';
import { PostMedia } from './entity/post-media.entity';
import { PostDraftMedia } from './entity/post-draft-media.entity';
import { PostDraft } from './entity/post-draft.entity';
import { User } from '../user/entity/user.entity';
import { Group } from '../group/entity/group.entity';
import { GroupMember } from '../group/entity/group_member.entity';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Post,
      PostBlock,
      PostContributor,
      PostMedia,
      PostDraftMedia,
      PostDraft,
      User,
      Group,
      GroupMember,
    ]),
    AuthModule,
    AuthModule,
  ],
  controllers: [PostController, PostDraftController],
  providers: [
    PostService,
    PostDraftService,
    PostDraftGateway,
    PresenceService,
    LockService,
    DraftStateService,
    PostPublishService,
    PatchStreamService,
  ],
})
export class PostModule {}
