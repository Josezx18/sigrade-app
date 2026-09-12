import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '@sigrade/shared-prisma';

interface WsHandshakePayload {
  tenantId?: string;
}

@WebSocketGateway({
  cors: { origin: process.env.CORS_ORIGIN || 'http://localhost:4200' },
  namespace: '/events',
})
export class EventsGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server!: Server;

  // tenantId is taken ONLY from a verified JWT (never from a client-supplied
  // query param), so a socket cannot impersonate another tenant's events.
  private connectedClients = new Map<string, string>();

  constructor(
    private readonly jwtService: JwtService,
    private readonly prisma: PrismaService,
  ) {}

  private extractToken(client: Socket): string | undefined {
    const auth = (client.handshake.auth ?? {}) as { token?: unknown };
    if (typeof auth.token === 'string') {
      return auth.token.replace(/^Bearer\s+/i, '');
    }
    const tokenQuery = (client.handshake.query as Record<string, unknown>).token;
    if (typeof tokenQuery === 'string') {
      return tokenQuery.replace(/^Bearer\s+/i, '');
    }
    const header = client.handshake.headers.authorization;
    if (typeof header === 'string') {
      return header.replace(/^Bearer\s+/i, '');
    }
    return undefined;
  }

  handleConnection(client: Socket) {
    const token = this.extractToken(client);
    if (!token) {
      client.disconnect(true);
      return;
    }
    try {
      const payload = this.jwtService.verify<WsHandshakePayload>(token);
      if (!payload?.tenantId) {
        client.disconnect(true);
        return;
      }
      this.connectedClients.set(client.id, payload.tenantId);
    } catch {
      client.disconnect(true);
    }
  }

  handleDisconnect(client: Socket) {
    this.connectedClients.delete(client.id);
  }

  @SubscribeMessage('subscribe')
  handleSubscribe(client: Socket, payload: { room: string }) {
    if (payload?.room) {
      client.join(payload.room);
    }
  }

  /**
   * Runs `work` with the RLS tenant context bound to `tenantId`. WebSocket
   * handlers that read/write tenant data MUST wrap their Prisma calls with this
   * (HTTP requests get their context from TenantContextInterceptor, but sockets
   * do not go through that interceptor).
   */
  runAsTenant<T>(tenantId: string, work: () => Promise<T>): Promise<T> {
    return this.prisma.runInTenantContext(tenantId, work);
  }

  notify(room: string, event: string, data: unknown) {
    this.server.to(room).emit(event, data);
  }

  notifyTenant(tenantId: string, event: string, data: unknown) {
    for (const [clientId, tid] of this.connectedClients) {
      if (tid === tenantId) {
        this.server.to(clientId).emit(event, data);
      }
    }
  }
}
