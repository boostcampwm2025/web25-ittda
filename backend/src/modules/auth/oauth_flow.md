2.1 Google / Kakao OAuth 단계 (Authentication)

(1) 클라이언트 → /auth/google

```ts
@UseGuards(AuthGuard('google'))
```

NestJS → Passport → GoogleStrategy

아직 컨트롤러 로직 실행 ❌

Passport가 302 Redirect 응답

브라우저가 Google 로그인 페이지로 이동

(2) Google 로그인 성공 → /auth/google/callback

Passport 내부 흐름:

HTTP Request
→ AuthGuard('google')
→ passport.authenticate('google')
→ GoogleStrategy.validate()

validate() 반환값:

```ts
{
    provider: 'google',
    providerId: 'xxxx',
    email: 'user@gmail.com',
    nickname: '홍길동'
}
```

이 객체가 그대로:

req.user

에 주입됩니다.

2.2 AuthService.oauthLogin()

```ts
const user = await this.userService.findOrCreateOAuthUser(req.user);
```

이 시점에서:

이미 OAuth 인증은 완료

이제 해야 할 일:

DB 사용자 식별

서비스 내부 인증 토큰(JWT) 발급

2.3 JWT 발급 원리

```ts
const payload = {
  sub: user.id,
  provider: user.provider,
};

const accessToken = jwtService.sign(payload);
```

JWT 구조

```text
HEADER → alg, typ
PAYLOAD → sub, provider, iat, exp
SIGNATURE → HMACSHA256(secret)
```

JWT_SECRET 없으면 절대 검증 불가

Stateless → 서버에 세션 저장 ❌

3. JwtStrategy + JwtGuard 동작 원리

3.1 보호된 API 예시

```ts
@Get('me')
@UseGuards(JwtAuthGuard)
getMe(@Req() req) {
    return req.user;
}
```

3.2 요청 흐름 (Postman 포함)
Client Request
Authorization: Bearer \<JWT\>

→ JwtAuthGuard
→ passport.authenticate('jwt')
→ JwtStrategy.validate()
→ payload 반환
→ req.user = payload
→ Controller 실행

3.3 jwt.strategy.ts 재확인

```ts
async validate(payload: any) {
    return payload;
}
```

반환값이 req.user

여기서 DB 조회도 가능 (권장 패턴)

# oauth 앱 등록

NestJS에서 브라우저 OAuth 로그인 흐름을 테스트하려면 먼저 Google과 Kakao에 OAuth 앱 등록을 반드시 해야 합니다.
OAuth2는 Provider(구글/카카오) 측에서 Redirect URI, Client ID/Secret 등을 등록한 앱만 인증을 허용하기 때문입니다.

아래에 정확한 등록 절차와 문서 링크를 정리합니다.

1. Google OAuth 앱 등록

목적

Google OAuth 로그인에서

Client ID

Client Secret

Redirect URI

를 발급받기 위해 등록

절차 (Cloud Console)

Google Cloud Console 접속
https://console.cloud.google.com

프로젝트 생성 또는 선택

OAuth 동의 화면 설정

사용자 유형: Internal/External

앱 이름, 이메일, 로고 등 기재

Credentials로 이동
→ Create Credentials > OAuth client ID

Application type: Web application 선택

Authorized redirect URIs 추가
예시:

http://localhost:4000/auth/google/callback

(NestJS controller의 callback 경로와 일치해야 함)

생성을 완료하면
Client ID 와 Client Secret 발급

해당 절차는 공식 Google 문서에 설명되어 있습니다.
Google Cloud Documentation

2. Kakao OAuth 앱 등록

목적

Kakao 측에서도 앱 정보를 등록해야만 카카오 로그인 요청을 받아줄 수 있습니다.

절차 (Kakao Developers)

Kakao Developers 접속
https://developers.kakao.com

로그인 (카카오 계정)

내 애플리케이션 > 앱 추가
이름, 사업자명 등 기입

앱 키 확인

REST API Key 사용

Client Secret 옵션

플랫폼 등록

웹 플랫폼에 개발 도메인 등록

http://localhost:4000

Redirect URI 등록

필수 설정 항목:

http://localhost:4000/auth/kakao/callback

(선택) 카카오 로그인 활성화

“카카오 로그인” 기능을 ON으로 설정

동의 항목 설정 필요 시 추가

리디렉트 URI 설정이 OAuth에서 필수이며, 등록된 주소와 정확히 일치해야 합니다.
