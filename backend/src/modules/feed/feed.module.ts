// src/modules/feed/feed.module.ts
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { FeedController } from './feed.controller';
import { FeedQueryService } from './feed.query.service';
import { FeedPersonalQueryService } from './feed.personal.query.service';
import { FeedGroupQueryService } from './feed.group.query.service';

import { Post } from '../post/entity/post.entity';
import { PostBlock } from '../post/entity/post-block.entity';
import { PostContributor } from '../post/entity/post-contributor.entity';
import { GroupMember } from '../group/entity/group_member.entity';
import { Group } from '../group/entity/group.entity';
import { GroupModule } from '../group/group.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Post,
      PostBlock,
      PostContributor,
      GroupMember,
      Group,
    ]),
    GroupModule,
  ],
  controllers: [FeedController],
  providers: [
    FeedQueryService,
    FeedPersonalQueryService,
    FeedGroupQueryService,
  ],
})
export class FeedModule {}
