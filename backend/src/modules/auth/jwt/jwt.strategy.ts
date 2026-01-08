import { PassportStrategy } from '@nestjs/passport';
import { Strategy, ExtractJwt } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { Injectable } from '@nestjs/common';

import type { JwtPayload } from 'jsonwebtoken';

interface MyJwtPayload extends JwtPayload {
  sub: string; // 사용자 ID
  email?: string;
  role: 'USER';
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private configService: ConfigService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      secretOrKey: configService.get<string>('JWT_SECRET')!,
    });
  }

  validate(payload: MyJwtPayload) {
    return payload;
  }
}
