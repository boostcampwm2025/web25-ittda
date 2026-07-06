import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { FcmToken } from './entity/fcm-token.entity';
import { NotificationService } from './notification.service';
import { NotificationController } from './notification.controller';

@Module({
  imports: [TypeOrmModule.forFeature([FcmToken])],
  controllers: [NotificationController],
  providers: [NotificationService],
  exports: [NotificationService],
})
export class NotificationModule {}
