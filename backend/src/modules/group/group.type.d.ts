import type { Request } from 'express';
import { MyJwtPayload } from '../auth/auth.type';

// Request 타입을 확장하여 지역적으로 정의
export type RequestWithUser = Request & {
  user: MyJwtPayload;
};
