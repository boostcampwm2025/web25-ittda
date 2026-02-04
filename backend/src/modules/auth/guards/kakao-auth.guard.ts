import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class KakaoAuthGuard extends AuthGuard('kakao') {
  getAuthenticateOptions() {
    return {
      //scope: ['profile_nickname', 'account_email'], // TODO: 이메일은 사업 출시하고 개인정보 동의항목 권한 신청해야 함
      scope: ['profile_nickname'],
    };
  }
}
