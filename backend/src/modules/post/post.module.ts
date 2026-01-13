import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PostController } from './post.controller';
import { PostService } from './post.service';

import { Post } from './entity/post.entity';
import { User } from '../user/user.entity';
import { Group } from '../group/entity/group.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Post, User, Group])],
  controllers: [PostController],
  providers: [PostService],
})
export class PostModule {}
