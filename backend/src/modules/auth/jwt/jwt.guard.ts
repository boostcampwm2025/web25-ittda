import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import {
  AUTH_ERROR_CODES,
  AuthUnauthorizedException,
} from '@/common/exceptions/auth-unauthorized.exception';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  handleRequest<TUser>(
    error: unknown,
    user: TUser | null | false,
    info: unknown,
  ): TUser {
    if (error instanceof Error) {
      throw error;
    }

    if (error) {
      throw new Error('Authentication failed', { cause: error });
    }

    if (user) {
      return user;
    }

    const errorName = this.getErrorName(info);

    if (errorName === 'TokenExpiredError') {
      throw new AuthUnauthorizedException(
        AUTH_ERROR_CODES.TOKEN_EXPIRED,
        this.getErrorMessage(info),
      );
    }

    if (errorName === 'JsonWebTokenError') {
      throw new AuthUnauthorizedException(
        AUTH_ERROR_CODES.INVALID_TOKEN,
        this.getErrorMessage(info),
      );
    }

    throw new AuthUnauthorizedException(
      AUTH_ERROR_CODES.UNAUTHORIZED,
      this.getErrorMessage(info),
    );
  }

  private getErrorName(error: unknown): string | undefined {
    return error instanceof Error ? error.name : undefined;
  }

  private getErrorMessage(error: unknown): string | undefined {
    return error instanceof Error ? error.message : undefined;
  }
}
