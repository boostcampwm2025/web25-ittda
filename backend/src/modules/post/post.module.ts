import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PostController } from './post.controller';
import { PostDraftController } from './post-draft.controller';
import { PostShareController } from './post-share.controller';
import { PostGroupShareController } from './post-group-share.controller';
import { PostDraftService } from './post-draft.service';
import { PostDraftGateway } from './post-draft.gateway';
import { PresenceService } from './collab/presence.service';
import { LockService } from './collab/lock.service';
import { DraftStateService } from './collab/draft-state.service';
import { PostService } from './post.service';
import { PostPublishService } from './post-publish.service';
import { PostGroupShareService } from './post-group-share.service';
import { PatchStreamService } from './collab/patch-stream.service';
import { PostDraftCleanupService } from './post-draft-cleanup.service';

import { Post } from './entity/post.entity';
import { PostBlock } from './entity/post-block.entity';
import { PostContributor } from './entity/post-contributor.entity';
import { PostMedia } from './entity/post-media.entity';
import { PostDraftMedia } from './entity/post-draft-media.entity';
import { PostDraft } from './entity/post-draft.entity';
import { PostGroupShare } from './entity/post-group-share.entity';
import { User } from '../user/entity/user.entity';
import { Group } from '../group/entity/group.entity';
import { GroupMember } from '../group/entity/group_member.entity';
import { AuthModule } from '../auth/auth.module';
import { GroupModule } from '../group/group.module';
import { MediaModule } from '../media/media.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Post,
      PostBlock,
      PostContributor,
      PostMedia,
      PostDraftMedia,
      PostDraft,
      PostGroupShare,
      User,
      Group,
      GroupMember,
    ]),
    AuthModule,
    forwardRef(() => GroupModule),
    MediaModule,
  ],
  controllers: [
    PostController,
    PostDraftController,
    PostShareController,
    PostGroupShareController,
  ],
  providers: [
    PostService,
    PostDraftService,
    PostDraftGateway,
    PresenceService,
    LockService,
    DraftStateService,
    PostPublishService,
    PostGroupShareService,
    PatchStreamService,
    PostDraftCleanupService,
  ],
  exports: [PostDraftCleanupService],
})
export class PostModule {}
