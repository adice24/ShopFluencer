import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt'; // 👈 ADD THIS
import { NotificationsGateway } from './notifications.gateway';
import { NotificationsService } from './notifications.service';
import { NotificationsController } from './notifications.controller';
import { PrismaService } from '../../database/prisma.service';

@Module({
  imports: [
    JwtModule.register({}), // 👈 ADD THIS
  ],
  providers: [NotificationsGateway, NotificationsService, PrismaService],
  controllers: [NotificationsController],
  exports: [NotificationsService, NotificationsGateway],
})
export class NotificationsModule {}
