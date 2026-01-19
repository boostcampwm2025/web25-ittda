import { Controller } from '@nestjs/common';
import { UserService } from './user.service';

// 마이페이지/설정
@Controller({
  path: 'user',
  version: '1',
})
export class UserController {
  constructor(private readonly userService: UserService) {}
}
