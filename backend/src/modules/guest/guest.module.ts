import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { GuestSession } from './guest-session.entity';
import { GuestSessionService } from './guest-session.service';
import { GuestController } from './guest.controller';

@Module({
  imports: [TypeOrmModule.forFeature([GuestSession])],
  providers: [GuestSessionService],
  controllers: [GuestController],
  exports: [GuestSessionService], // AuthModule에서 사용
})
export class GuestModule {}
