import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { WsException } from '@nestjs/websockets';
import type { Socket } from 'socket.io';

import type { MyJwtPayload } from '../auth.type';

@Injectable()
export class WsJwtGuard implements CanActivate {
  constructor(private readonly jwtService: JwtService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const client = context.switchToWs().getClient<Socket>();
    const token = this.extractToken(client);

    if (!token) {
      throw new WsException('Access token is required.');
    }

    try {
      const payload = await this.jwtService.verifyAsync<MyJwtPayload>(token);
      const data = client.data as { user?: MyJwtPayload };
      data.user = payload;
      return true;
    } catch {
      throw new WsException('Invalid access token.');
    }
  }

  private extractToken(client: Socket): string | null {
    const authToken = (client.handshake.auth ?? {}) as { token?: string };
    if (authToken.token) {
      return authToken.token;
    }

    const header = client.handshake.headers.authorization;
    if (typeof header === 'string') {
      return header.startsWith('Bearer ') ? header.slice(7) : header;
    }

    return null;
  }
}
