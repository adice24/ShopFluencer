# ShopFluence — Real-Time SaaS Implementation Plan

## Phase 1: Database Schema & Supabase Setup
- [ ] `002_full_schema.sql` — All tables: profiles, influencer_stores, products, orders, order_items, payments, analytics_events
- [ ] RLS policies for every table
- [ ] Realtime enabled on products, orders, analytics_events

## Phase 2: Real-Time Data Layer
- [ ] `src/lib/realtime.ts` — Supabase Realtime manager (subscribe/unsubscribe)
- [ ] `src/hooks/useRealtimeQuery.ts` — Hook combining react-query + Supabase Realtime
- [ ] `src/hooks/useRealtimeSubscription.ts` — Low-level subscription hook
- [ ] `src/lib/events.ts` — Event type definitions and emitters

## Phase 3: Auth & Role Guards
- [ ] `src/components/guards/ProtectedRoute.tsx` — Role-based route guard
- [ ] `src/components/guards/AdminRoute.tsx` — Admin-only guard
- [ ] Update `App.tsx` with full routing (all roles)

## Phase 4: Influencer Dashboard (Live Data)
- [ ] `src/hooks/useInfluencerStore.ts` — CRUD + Realtime for products
- [ ] `src/hooks/useOrders.ts` — Live order feed
- [ ] `src/hooks/useAnalytics.ts` — Real-time analytics
- [ ] Update Overview.tsx → live stats
- [ ] Update MyStore.tsx → Supabase products + drag reorder
- [ ] Update Orders.tsx → live order stream
- [ ] Update Analytics.tsx → live charts

## Phase 5: Public Storefront (Live Commerce)
- [ ] Update StorefrontPage.tsx → Supabase products + Realtime
- [ ] `src/hooks/useCart.ts` — Cart state management
- [ ] `src/pages/CheckoutPage.tsx` — Checkout flow
- [ ] Analytics event tracking (clicks, visits)

## Phase 6: Admin Panel (Live Monitoring)
- [ ] `src/hooks/useAdminData.ts` — Platform-wide queries
- [ ] Update AdminDashboard → live stats
- [ ] AdminInfluencers → approve/reject with instant effect
- [ ] AdminOrders → live order stream
- [ ] AdminProducts → assign products to influencers

## Phase 7: Polish & Security
- [ ] Loading skeletons for all data
- [ ] Error boundaries
- [ ] Optimistic UI updates
- [ ] Final security audit
