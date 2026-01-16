import { Controller, Get, Res } from '@nestjs/common';
import { AppService } from './app.service';

import type { Response } from 'express';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  getHello(): string {
    return this.appService.getHello();
  }

  @Get('.well-known/appspecific/com.chrome.devtools.json')
  @Get('favicon.ico')
  ignoreDefaultRequests(@Res() res: Response) {
    // 특정 기본 브라우저 요청을 무시하는 컨트롤러 메소드
    res.status(204).send();
  }
}
