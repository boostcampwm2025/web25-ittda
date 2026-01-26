// src/modules/feed/feed.module.ts
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { FeedController } from './feed.controller';
import { FeedQueryService } from './feed.query.service';

import { Post } from '../post/entity/post.entity';
import { PostBlock } from '../post/entity/post-block.entity';
import { GroupMember } from '../group/entity/group_member.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Post, PostBlock, GroupMember])],
  controllers: [FeedController],
  providers: [FeedQueryService],
})
export class FeedModule {}
