import { Injectable, Logger } from '@nestjs/common';
import { AdminRealtimeGateway } from './admin-realtime.gateway';

/** Scopes map to React Query keys on the admin SPA (see useAdminRealtime). */
export const ADMIN_REALTIME_SCOPES = [
  'overview',
  'approvals',
  'transactions',
  'users',
  'products',
  'settings',
  'all',
] as const;

export type AdminRealtimeScope = (typeof ADMIN_REALTIME_SCOPES)[number];

@Injectable()
export class AdminRealtimeService {
  private readonly logger = new Logger(AdminRealtimeService.name);

  constructor(private readonly gateway: AdminRealtimeGateway) {}

  /**
   * Push a live update to every connected platform admin dashboard.
   * Safe to call even when no admins are connected.
   */
  emit(scopes: readonly string[]) {
    const unique = [...new Set(scopes.filter(Boolean))];
    if (unique.length === 0) return;
    try {
      this.gateway.emitToAdmins('platform:update', {
        scopes: unique,
        ts: Date.now(),
      });
    } catch (e) {
      this.logger.warn(`Admin realtime emit failed: ${String(e)}`);
    }
  }
}
