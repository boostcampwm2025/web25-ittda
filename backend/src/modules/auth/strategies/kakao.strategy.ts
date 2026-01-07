import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-kakao';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import type { KakaoProfile } from 'passport-kakao';

@Injectable()
export class KakaoStrategy extends PassportStrategy(Strategy, 'kakao') {
  constructor(private configService: ConfigService) {
    super({
      clientID: configService.get<string>('KAKAO_CLIENT_ID')!,
      callbackURL: `/v1/auth/kakao/callback`,
    });
  }

  validate(_: string, __: string, profile: KakaoProfile) {
    return {
      provider: 'kakao',
      providerId: profile.id,
      email: profile._json.kakao_account?.email,
      nickname: profile.username,
    }; // 이 객체가 req.user에 들어감
  }
}
