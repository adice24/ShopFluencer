import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';

function parseCookieHeader(header?: string): Record<string, string> {
  const out: Record<string, string> = {};
  if (!header) return out;
  for (const part of header.split(';')) {
    const idx = part.indexOf('=');
    if (idx === -1) continue;
    const k = part.slice(0, idx).trim();
    const v = part.slice(idx + 1).trim();
    try {
      out[k] = decodeURIComponent(v);
    } catch {
      out[k] = v;
    }
  }
  return out;
}

@WebSocketGateway({
  namespace: '/platform-admin',
  cors: {
    origin: (
      origin: string | undefined,
      callback: (err: Error | null, ok?: boolean) => void,
    ) => {
      callback(null, true);
    },
    credentials: true,
  },
})
export class AdminRealtimeGateway
  implements OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(AdminRealtimeGateway.name);
  private readonly room = 'admins';

  constructor(
    private readonly jwtService: JwtService,
    private readonly config: ConfigService,
  ) {}

  private extractToken(client: Socket): string | null {
    const auth = client.handshake.auth as { token?: string } | undefined;
    const bearer = auth?.token;
    if (typeof bearer === 'string') {
      const m = bearer.match(/^Bearer\s+(.+)$/i);
      return m ? m[1].trim() : bearer.trim();
    }
    const q = client.handshake.query?.token;
    if (typeof q === 'string' && q) return q.trim();

    const cookies = parseCookieHeader(client.handshake.headers.cookie);
    return cookies['admin_token'] || null;
  }

  private verifyAdminToken(token: string): boolean {
    try {
      const secret =
        this.config.get<string>('ADMIN_JWT_SECRET') || 'fallback_admin_secret';
      const payload = this.jwtService.verify<{ role?: string }>(token, {
        secret,
      });
      return String(payload.role || '').toLowerCase() === 'admin';
    } catch {
      return false;
    }
  }

  handleConnection(client: Socket) {
    const token = this.extractToken(client);
    if (!token || !this.verifyAdminToken(token)) {
      this.logger.warn(`Rejected platform-admin socket ${client.id}`);
      client.disconnect(true);
      return;
    }
    void client.join(this.room);
    this.logger.log(`Platform admin socket connected: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`Platform admin socket disconnected: ${client.id}`);
  }

  /** Broadcast to all authenticated platform-admin sockets. */
  emitToAdmins(event: string, payload: unknown) {
    this.server.to(this.room).emit(event, payload);
  }
}
