import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UserService } from '../user/user.service';
import type { OAuthUserType } from './auth.type';

@Injectable()
export class AuthService {
  constructor(
    private readonly userService: UserService,
    private readonly jwtService: JwtService,
  ) {}

  async oauthLogin(oauthUser: OAuthUserType) {
    const user = await this.userService.findOrCreateOAuthUser(oauthUser);

    const payload = {
      sub: user.id,
      provider: user.provider,
    };

    return {
      accessToken: this.jwtService.sign(payload),
      user,
    };
  }
}
