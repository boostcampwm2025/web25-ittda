import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Post } from '@/modules/post/entity/post.entity';
import { PostContributor } from '@/modules/post/entity/post-contributor.entity';
import { MapService } from './map.service';
import { MapController } from './map.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Post, PostContributor])],
  controllers: [MapController],
  providers: [MapService],
  exports: [MapService],
})
export class MapModule {}
