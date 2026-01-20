import { Module } from '@nestjs/common';
import { UserController } from './user.controller';
import { UserService } from './user.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from './entity/user.entity';
import { Post } from '../post/entity/post.entity';
import { PostBlock } from '../post/entity/post-block.entity';
import { UserMonthCover } from './entity/user-month-cover.entity';

// User 모듈 정의
@Module({
  imports: [TypeOrmModule.forFeature([User, Post, PostBlock, UserMonthCover])],
  controllers: [UserController],
  providers: [UserService],
  exports: [UserService],
})
export class UserModule {}
