import { Module } from '@nestjs/common';
import { NotificationsGateway } from './notifications.gateway';
import { NotificationsService } from './notifications.service';
import { NotificationsController } from './notifications.controller';
import { PrismaService } from '../../database/prisma.service';

@Module({
    providers: [NotificationsGateway, NotificationsService, PrismaService],
    controllers: [NotificationsController],
    exports: [NotificationsService, NotificationsGateway],
})
export class NotificationsModule { }
