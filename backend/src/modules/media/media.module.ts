import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { MediaController } from './media.controller';
import { MediaService } from './media.service';
import { MediaAsset } from './entity/media-asset.entity';
import { PostDraftMedia } from '@/modules/post/entity/post-draft-media.entity';
import { PostDraft } from '@/modules/post/entity/post-draft.entity';
import { PostMedia } from '@/modules/post/entity/post-media.entity';
import { Post } from '@/modules/post/entity/post.entity';
import { GroupMember } from '@/modules/group/entity/group_member.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      MediaAsset,
      PostDraftMedia,
      PostDraft,
      PostMedia,
      Post,
      GroupMember,
    ]),
  ],
  controllers: [MediaController],
  providers: [MediaService],
  exports: [MediaService],
})
export class MediaModule {}
