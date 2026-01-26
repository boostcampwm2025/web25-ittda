import { Module } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';
import { JwtModule } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { UserModule } from '../user/user.module';
import { GoogleStrategy } from './strategies/google.strategy';
import { KakaoStrategy } from './strategies/kakao.strategy';
import { JwtStrategy } from './jwt/jwt.strategy';
import { GuestModule } from '../guest/guest.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RefreshToken } from './refresh_token/refresh_token.entity';
import { WsJwtGuard } from './ws/ws-jwt.guard';

@Module({
  imports: [
    TypeOrmModule.forFeature([RefreshToken]),
    PassportModule,
    JwtModule.registerAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_SECRET'),
        signOptions: { expiresIn: '1h' },
      }),
    }),
    UserModule,
    GuestModule,
  ],
  controllers: [AuthController],
  providers: [
    AuthService,
    GoogleStrategy,
    KakaoStrategy,
    JwtStrategy,
    WsJwtGuard,
  ],
  exports: [WsJwtGuard, JwtModule],
})
export class AuthModule {}
