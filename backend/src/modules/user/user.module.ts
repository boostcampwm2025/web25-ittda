import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm'; // 데이터베이스 연동 시
import { UserController } from './user.controller';
import { UserService } from './user.service';
import { User } from './entity/user.entity';
import { Post } from '../post/entity/post.entity';
import { PostBlock } from '../post/entity/post-block.entity';
import { UserMonthCover } from './entity/user-month-cover.entity';

@Module({
  imports: [TypeOrmModule.forFeature([User, Post, PostBlock, UserMonthCover])],
  controllers: [UserController],
  providers: [UserService],
  exports: [UserService],
})
export class UserModule {}
