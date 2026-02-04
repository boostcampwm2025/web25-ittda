import type { JwtPayload } from 'jsonwebtoken';

export type OAuthProvider = 'google' | 'kakao' | 'guest';

export type OAuthUserType = {
  provider: OAuthProvider;
  providerId: string;
  email?: string;
  nickname: string;
};

export interface MyJwtPayload extends JwtPayload {
  sub: string; // 사용자 ID
  email?: string; // 이메일
}

declare module 'passport-kakao' {
  import { Strategy as PassportStrategy } from 'passport';

  export interface KakaoAccount {
    profile_nickname_needs_agreement?: boolean;
    profile_image_needs_agreement?: boolean;
    profile?: {
      nickname?: string;
      thumbnail_image_url?: string;
      profile_image_url?: string;
      is_default_image?: boolean;
    };
    email_needs_agreement?: boolean;
    is_email_valid?: boolean;
    is_email_verified?: boolean;
    email?: string;
  }

  export interface KakaoProfileJson {
    id: number;
    connected_at?: string;
    kakao_account?: KakaoAccount;
  }

  export interface KakaoProfile {
    id: string;
    username?: string;
    displayName?: string;
    _json: KakaoProfileJson;
  }

  export interface StrategyOptions {
    clientID: string;
    clientSecret?: string;
    callbackURL: string;
    passReqToCallback?: boolean;
  }

  class Strategy extends PassportStrategy {
    constructor(
      options: StrategyOptions,
      verify: (
        accessToken: string,
        refreshToken: string,
        profile: KakaoProfile,
        done: (error: any, user?: any) => void,
      ) => void,
    );
  }

  export { Strategy };
}

declare namespace Express {
  export interface Request {
    cookies: { refreshToken?: string; [key: string]: string | undefined };
  }
}
