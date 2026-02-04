import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TrashController } from './trash.controller';
import { TrashService } from './trash.service';
import { Post } from '../post/entity/post.entity';
import { User } from '../user/entity/user.entity';
import { GuestSession } from '../guest/guest-session.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Post, User, GuestSession])],
  controllers: [TrashController],
  providers: [TrashService],
  exports: [TrashService],
})
export class TrashModule {}
