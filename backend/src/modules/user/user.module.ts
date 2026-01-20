import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm'; // 데이터베이스 연동 시
import { UserController } from './user.controller';
import { UserService } from './user.service';
import { User } from './user.entity'; // User 엔티티
import { Post } from '../post/entity/post.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([User, Post]), // User 엔티티를 모듈에서 사용하도록 등록
  ],
  controllers: [UserController],
  providers: [UserService],
  exports: [UserService],
})
export class UserModule {}
