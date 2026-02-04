import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { ThrottlerModule } from '@nestjs/throttler';

import { AppController } from './app.controller';
import { AppService } from './app.service';
import { getTypeOrmConfig } from './config/typeorm/typeorm.config';
import { LoggingModule } from './modules/logging_winston';
import { PostModule } from './modules/post/post.module';
import { UserModule } from './modules/user/user.module';
import { AuthModule } from './modules/auth/auth.module';
import { GroupModule } from './modules/group/group.module';
import { GuestModule } from './modules/guest/guest.module';
import { FeedModule } from './modules/feed/feed.module';
import { MyPageModule } from './modules/mypage/mypage.module';
import { StatsModule } from './modules/stats/stats.module';
import { SearchModule } from './modules/search/search.module';
import { MapModule } from './modules/map/map.module';
import { TemplateModule } from './modules/template/template.module';
import { MediaModule } from './modules/media/media.module';
import { TrashModule } from './modules/trash/trash.module';
import { RedisModule } from '@liaoliaots/nestjs-redis';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: `.env.${process.env.NODE_ENV ?? 'local'}`,
    }),
    ScheduleModule.forRoot(),
    ThrottlerModule.forRoot({
      throttlers: [{ ttl: 60, limit: 20 }], // 1분당 20회 제한
    }),
    RedisModule.forRoot({
      config: {
        host: process.env.REDIS_HOST || 'localhost',
        port: Number(process.env.REDIS_PORT) || 6379,
        // password: 'redis_password', // 필요한 경우
      },
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: getTypeOrmConfig,
      inject: [ConfigService],
    }),
    LoggingModule,
    PostModule,
    UserModule,
    AuthModule,
    GroupModule,
    GuestModule,
    FeedModule,
    MyPageModule,
    StatsModule,
    SearchModule,
    MapModule,
    TemplateModule,
    MediaModule,
    TrashModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
