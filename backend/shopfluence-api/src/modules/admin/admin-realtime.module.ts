import { Global, Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule } from '@nestjs/config';
import { AdminRealtimeGateway } from './admin-realtime.gateway';
import { AdminRealtimeService } from './admin-realtime.service';

@Global()
@Module({
  imports: [ConfigModule, JwtModule.register({})],
  providers: [AdminRealtimeGateway, AdminRealtimeService],
  exports: [AdminRealtimeService],
})
export class AdminRealtimeModule {}
