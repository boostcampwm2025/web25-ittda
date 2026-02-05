import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { GuestSession } from './guest-session.entity';
import { GuestSessionService } from './guest-session.service';
import { GuestMigrationService } from './guest-migration.service';
import { GuestController } from './guest.controller';

import { UserModule } from '../user/user.module';
import { User } from '../user/entity/user.entity';
import { Post } from '../post/entity/post.entity';
import { PostContributor } from '../post/entity/post-contributor.entity';
import { MediaAsset } from '../media/entity/media-asset.entity';
import { GroupMember } from '../group/entity/group_member.entity';
import { UserMonthCover } from '../user/entity/user-month-cover.entity';
import { Template } from '../template/entity/template.entity';

import { JwtModule } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      GuestSession,
      User,
      Post,
      PostContributor,
      MediaAsset,
      GroupMember,
      UserMonthCover,
      Template,
    ]),
    UserModule,
    JwtModule.registerAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_SECRET'),
        signOptions: { expiresIn: '1h' },
      }),
    }),
  ],
  providers: [GuestSessionService, GuestMigrationService],
  controllers: [GuestController],
  exports: [GuestSessionService, GuestMigrationService], // AuthModule에서 사용
})
export class GuestModule {}
