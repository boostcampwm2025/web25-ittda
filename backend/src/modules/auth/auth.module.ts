// import { Module } from '@nestjs/common';
// import { PassportModule } from '@nestjs/passport';
// import { JwtModule } from '@nestjs/jwt';
// import { AuthController } from './auth.controller';
// import { AuthService } from './auth.service';
// import { UserModule } from '../user/user.module';
// import { GoogleStrategy } from './strategies/google.strategy';
// import { KakaoStrategy } from './strategies/kakao.strategy';
// import { JwtStrategy } from './jwt/jwt.strategy';

// @Module({
//   imports: [
//     PassportModule,
//     JwtModule.register({
//       secret: process.env.JWT_SECRET,
//       signOptions: { expiresIn: '1h' },
//     }),
//     UserModule,
//   ],
//   controllers: [AuthController],
//   providers: [AuthService, GoogleStrategy, KakaoStrategy, JwtStrategy],
// })
// export class AuthModule {}
