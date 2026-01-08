import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { getTypeOrmConfig } from './config/typeorm/typeorm.config';
import { LoggingModule } from './modules/logging_winston';
import { PostModule } from './modules/post/post.module';
import { UserModule } from './modules/user/user.module';
import { AuthModule } from './modules/auth/auth.module';
//import { GroupModule } from './modules/group/group.module';

@Module({
  imports: [
    // 환경변수 설정을 위한 ConfigModule 등록
    ConfigModule.forRoot({
      // isGlobal: true → 애플리케이션 전체에서 ConfigModule을 전역으로 사용 가능
      // (다른 모듈에서 따로 import하지 않아도 ConfigService를 주입받을 수 있음)
      isGlobal: true,

      // envFilePath: '.env' → 환경변수 파일 경로 지정
      // 기본적으로 프로젝트 루트의 .env 파일을 읽어서 process.env에 로드
      envFilePath: '.env',
    }),
    ...(process.env.USE_INMEMORY_DB === 'true'
      ? []
      : // 데이터베이스 연결을 위한 TypeOrmModule 등록
        // DB 연결 설정을 비동기/동적 방식으로 구성
        [
          TypeOrmModule.forRootAsync({
            // imports: [ConfigModule] → ConfigService를 사용하기 위해 ConfigModule을 가져옴
            imports: [ConfigModule],

            // useFactory: getTypeOrmConfig → DB 연결 설정을 반환하는 팩토리 함수
            // ConfigService를 받아서 동적으로 DB 설정을 구성할 수 있음
            useFactory: getTypeOrmConfig,

            // inject: [ConfigService] → useFactory 함수에 주입할 의존성 지정
            // 여기서는 ConfigService를 주입해서 환경변수 기반으로 DB 설정을 만듦
            inject: [ConfigService],
          }),
        ]),
    LoggingModule,
    PostModule,
    UserModule,
    AuthModule,
    //GroupModule
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
