import {
    WebSocketGateway,
    WebSocketServer,
    OnGatewayConnection,
    OnGatewayDisconnect,
    SubscribeMessage,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { UseGuards, Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';

@WebSocketGateway({
    cors: { origin: '*' },
    namespace: '/notifications'
})
export class NotificationsGateway implements OnGatewayConnection, OnGatewayDisconnect {
    @WebSocketServer()
    server: Server;

    private logger = new Logger(NotificationsGateway.name);

    constructor(private readonly jwtService: JwtService) { }

    private userSockets = new Map<string, string[]>(); // userId -> socketIds

    async handleConnection(client: Socket) {
        try {
            const token = client.handshake.auth.token?.split(' ')[1] || client.handshake.query.token;
            if (!token) {
                client.disconnect();
                return;
            }

            const payload = this.jwtService.verify(token);
            const userId = payload.sub;

            client.data.userId = userId;

            const existingSockets = this.userSockets.get(userId) || [];
            this.userSockets.set(userId, [...existingSockets, client.id]);

            this.logger.log(`Client connected: ${client.id} (User: ${userId})`);
        } catch (e) {
            this.logger.warn(`Failed connection attempt: ${e.message}`);
            client.disconnect();
        }
    }

    handleDisconnect(client: Socket) {
        const userId = client.data.userId;
        if (userId) {
            const userSocketIds = this.userSockets.get(userId) || [];
            this.userSockets.set(
                userId,
                userSocketIds.filter((id) => id !== client.id)
            );
            if (this.userSockets.get(userId)?.length === 0) {
                this.userSockets.delete(userId);
            }
        }
        this.logger.log(`Client disconnected: ${client.id}`);
    }

    sendNotification(userId: string, data: any) {
        const sockets = this.userSockets.get(userId) || [];
        for (const socketId of sockets) {
            this.server.to(socketId).emit('notification', data);
        }
    }
}
