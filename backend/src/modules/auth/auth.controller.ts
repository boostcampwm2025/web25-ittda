// import { Controller, Get, Req, UseGuards, Res } from '@nestjs/common';
// import { AuthGuard } from '@nestjs/passport';
// import { AuthService } from './auth.service';

// @Controller({
//   path: 'auth',
//   version: '1',
// }) // /api/v1/auth/~
// export class AuthController {
//   constructor(private readonly authService: AuthService) {}

//   @Get('google')
//   @UseGuards(AuthGuard('google'))
//   async googleLogin() {}

//   @Get('google/callback')
//   @UseGuards(AuthGuard('google'))
//   async googleCallback(@Req() req, @Res() res) {
//     const result = await this.authService.oauthLogin(req.user);
//     res.redirect(
//       `http://localhost:3000/oauth/callback?token=${result.accessToken}`,
//     );
//   }

//   @Get('kakao')
//   @UseGuards(AuthGuard('kakao'))
//   async kakaoLogin() {}

//   @Get('kakao/callback')
//   @UseGuards(AuthGuard('kakao'))
//   async kakaoCallback(@Req() req, @Res() res) {
//     const result = await this.authService.oauthLogin(req.user);
//     res.redirect(
//       `http://localhost:3000/oauth/callback?token=${result.accessToken}`,
//     );
//   }
// }
