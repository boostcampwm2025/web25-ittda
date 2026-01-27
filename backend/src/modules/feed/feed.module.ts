// src/modules/feed/feed.module.ts
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { FeedController } from './feed.controller';
import { FeedQueryService } from './feed.query.service';
import { FeedPersonalQueryService } from './feed.personal.query.service';
import { FeedGroupQueryService } from './feed.group.query.service';

import { Post } from '../post/entity/post.entity';
import { PostBlock } from '../post/entity/post-block.entity';
import { GroupModule } from '../group/group.module';

@Module({
  imports: [TypeOrmModule.forFeature([Post, PostBlock]), GroupModule],
  controllers: [FeedController],
  providers: [
    FeedQueryService,
    FeedPersonalQueryService,
    FeedGroupQueryService,
  ],
})
export class FeedModule {}
