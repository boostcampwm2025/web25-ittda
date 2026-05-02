import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MyPageController } from './mypage.controller';
import { MyPageService } from './mypage.service';
import { User } from '../user/entity/user.entity';
import { StatsModule } from '../stats/stats.module';
import { RefreshToken } from '../auth/refresh_token/refresh_token.entity';
import { GroupModule } from '../group/group.module';
import { PostModule } from '../post/post.module';

// Mypage 모듈 정의
@Module({
  imports: [
    TypeOrmModule.forFeature([User, RefreshToken]),
    StatsModule,
    GroupModule,
    PostModule,
  ],
  controllers: [MyPageController],
  providers: [MyPageService],
  exports: [MyPageService],
})
export class MyPageModule {}
