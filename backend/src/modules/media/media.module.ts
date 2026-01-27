import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { MediaController } from './media.controller';
import { MediaService } from './media.service';
import { MediaAsset } from './entity/media-asset.entity';

@Module({
  imports: [TypeOrmModule.forFeature([MediaAsset])],
  controllers: [MediaController],
  providers: [MediaService],
  exports: [MediaService],
})
export class MediaModule {}
