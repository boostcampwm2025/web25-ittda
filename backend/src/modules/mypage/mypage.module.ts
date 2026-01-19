import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm'; // 데이터베이스 연동 시
import { MyPageController } from './mypage.controller';
import { MyPageService } from './mypage.service';
import { User } from '../user/user.entity'; // User 엔티티
import { Post } from '../post/entity/post.entity';

// Mypage 모듈 정의
@Module({
  imports: [
    TypeOrmModule.forFeature([User, Post]), // User 엔티티를 모듈에서 사용하도록 등록
  ],
  controllers: [MyPageController],
  providers: [MyPageService],
  exports: [MyPageService],
})
export class MyPageModule {}
