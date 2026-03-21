import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { AdminService } from './admin.service';
import { AdminController } from './admin.controller';
import { AdminAuthController } from './admin-auth.controller';
import { AdminAuthService } from './admin-auth.service';
import { AdminAuthGuard } from './admin-auth.guard';
import { UsersModule } from '../users/users.module';
import { DatabaseModule } from '../../database/database.module';
import { CatalogModule } from '../catalog/catalog.module';
import { AnalyticsModule } from '../analytics/analytics.module';

@Module({
  imports: [
    DatabaseModule,
    UsersModule,
    JwtModule.register({}),
    CatalogModule,
    AnalyticsModule,
  ],
  controllers: [AdminController, AdminAuthController],
  providers: [AdminService, AdminAuthService, AdminAuthGuard],
})
export class AdminModule {}
