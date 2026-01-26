import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { StatsController } from './stats.controller';
import { StatsService } from './stats.service';
import { Post } from '../post/entity/post.entity';
import { PostBlock } from '../post/entity/post-block.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Post, PostBlock])],
  controllers: [StatsController],
  providers: [StatsService],
  exports: [StatsService],
})
export class StatsModule {}
