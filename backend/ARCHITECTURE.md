# ShopFluence — Backend Architecture Document
## Influencer E-Commerce & Branding Platform

**Version:** 1.0  
**Author:** Principal Backend Architect  
**Date:** 2026-02-20  
**Classification:** Internal — Engineering

---

## 1. Executive Summary

ShopFluence is an influencer-driven commerce platform enabling brands to distribute products through influencer storefronts. The backend is designed as a **Modular Monolith** (Phase 1) that is **microservice-ready** (Phase 2+), following Domain-Driven Design (DDD) principles with Clean Architecture.

### Key Design Decisions

| Decision | Choice | Justification |
|----------|--------|---------------|
| Language | TypeScript (Node.js) | End-to-end type safety with frontend, massive ecosystem |
| Framework | NestJS | Built-in DI, modular architecture, guards, interceptors, enterprise-grade |
| ORM | Prisma | Type-safe queries, migrations, introspection, excellent DX |
| Database | PostgreSQL 16 | ACID compliance, JSONB for flexible data, full-text search, partitioning |
| Cache | Redis 7 | Sub-ms reads for storefront, rate limiting, session store, pub/sub |
| Queue | BullMQ (Redis-backed) | Background jobs, retries, scheduling, dead-letter queues |
| Auth | JWT (Access + Refresh) | Stateless, horizontally scalable, short-lived access tokens |
| API Style | REST (versioned) | Predictable, cacheable, CDN-friendly for storefronts |
| Container | Docker + Docker Compose | Consistent environments, cloud-native deployment |
| CI/CD | GitHub Actions | Integrated with repository, parallel jobs, matrix testing |

---

## 2. Domain Boundaries (DDD Bounded Contexts)

```
┌──────────────────────────────────────────────────────────────────┐
│                     ShopFluence Platform                         │
├──────────────┬──────────────┬──────────────┬────────────────────┤
│  Identity    │   Catalog    │  Commerce    │   Analytics        │
│  Context     │   Context    │  Context     │   Context          │
├──────────────┼──────────────┼──────────────┼────────────────────┤
│ • Users      │ • Categories │ • Orders     │ • PageViews        │
│ • Auth       │ • Brands     │ • OrderItems │ • ClickEvents      │
│ • Roles      │ • Products   │ • Payments   │ • ConversionEvents │
│ • Profiles   │ • Variants   │ • Affiliate  │ • RevenueMetrics   │
│ • Sessions   │ • Images     │   Tracking   │ • DailyAggregates  │
│              │ • Storefront │ • Commissions│                    │
└──────────────┴──────────────┴──────────────┴────────────────────┘
```

### Domain Events (Event-Driven)
```
Identity:    UserRegistered, UserApproved, ProfileUpdated
Catalog:     ProductCreated, StorefrontPublished, BrandAssigned
Commerce:    OrderCreated, PaymentSucceeded, PaymentFailed, OrderFulfilled
Analytics:   StorefrontViewed, ProductClicked, ConversionTracked
```

---

## 3. Service Decomposition Plan

### Phase 1 — Modular Monolith
All services live in a single deployable unit but are **strictly module-isolated** with clear interfaces.

```
src/
├── modules/
│   ├── auth/           # Identity & Access Management
│   ├── users/          # User CRUD, profiles
│   ├── catalog/        # Products, categories, brands
│   ├── storefront/     # Influencer storefront engine
│   ├── orders/         # Order lifecycle management
│   ├── payments/       # Payment processing abstraction
│   ├── affiliates/     # Tracking & attribution
│   ├── analytics/      # Event ingestion & aggregation
│   ├── admin/          # Admin operations & dashboard
│   └── notifications/  # Email, push, webhooks
├── common/             # Shared DTOs, guards, interceptors, filters
├── config/             # Environment-based configuration
├── database/           # Prisma schema, migrations, seeds
└── infrastructure/     # Redis, queues, file storage, logging
```

### Phase 2 — Microservice Extraction Order
1. **Analytics Service** (highest write volume, independent)
2. **Payment Service** (security isolation required)
3. **Storefront Service** (read-heavy, CDN-optimized)
4. **Notification Service** (async, fire-and-forget)
5. **Catalog Service** (moderate coupling)
6. **Order Service** (core, extract last)

---

## 4. Architecture Diagram

```
                            ┌─────────────┐
                            │   CDN       │
                            │ CloudFront  │
                            └──────┬──────┘
                                   │
                            ┌──────▼──────┐
                            │   NGINX     │
                            │   Reverse   │
                            │   Proxy     │
                            └──────┬──────┘
                                   │
                    ┌──────────────┼──────────────┐
                    │              │              │
              ┌─────▼─────┐ ┌─────▼─────┐ ┌─────▼─────┐
              │  API       │ │  API       │ │  API       │
              │  Instance  │ │  Instance  │ │  Instance  │
              │  :3000     │ │  :3001     │ │  :3002     │
              └─────┬─────┘ └─────┬─────┘ └─────┬─────┘
                    │              │              │
         ┌─────────┼──────────────┼──────────────┼─────────┐
         │         │              │              │         │
    ┌────▼────┐ ┌──▼───┐ ┌───────▼───────┐ ┌───▼────┐   │
    │ Redis   │ │Redis │ │  PostgreSQL   │ │ BullMQ │   │
    │ Cache   │ │Pub/  │ │  Primary      │ │ Queue  │   │
    │ Cluster │ │Sub   │ │  + Read       │ │ Workers│   │
    │         │ │      │ │  Replicas     │ │        │   │
    └─────────┘ └──────┘ └───────────────┘ └────────┘   │
                                                         │
                                              ┌──────────▼──┐
                                              │  S3 / Cloud  │
                                              │  Storage     │
                                              └──────────────┘
```

---

## 5. Security Threat Model (STRIDE)

| Threat | Category | Mitigation |
|--------|----------|------------|
| Token theft | Spoofing | Short-lived JWT (15min), HTTP-only refresh cookies, token rotation |
| Payment replay | Tampering | Idempotency keys, webhook signature verification (HMAC SHA-256) |
| SQL Injection | Tampering | Prisma parameterized queries, input validation (class-validator) |
| Brute force | DoS | Rate limiting (Redis-backed), progressive delays, account lockout |
| XSS in storefront | Information Disclosure | CSP headers, output encoding, sanitize rich text |
| CSRF | Spoofing | SameSite cookies, CSRF tokens for state-changing ops |
| File upload exploit | Elevation of Privilege | File type validation, virus scanning, isolated storage |
| Unauthorized admin access | Elevation of Privilege | RBAC guards, audit logging, IP whitelisting |
| Duplicate orders | Tampering | Database-level unique constraints, payment intent idempotency |
| Webhook forgery | Spoofing | Signature verification, IP allowlisting, replay protection |

---

## 6. Data Migration Strategy

### Forward-Only Migrations
- All migrations are **versioned, timestamped, and irreversible** in production
- Prisma Migrate for schema evolution
- Data migrations as separate scripts (not mixed with schema)

### Blue-Green Deployment Migration Protocol
1. Deploy new schema (backward-compatible additions only)
2. Deploy new code that writes to both old and new columns
3. Backfill data migration
4. Deploy code that reads from new columns
5. Drop old columns in next release

### Rollback Strategy
- Schema rollbacks via `prisma migrate resolve`
- Application rollbacks via container image revert
- Data rollbacks via point-in-time recovery (PostgreSQL WAL)

---

## 7. Multi-Region Deployment Plan

### Phase 1 — Single Region (ap-south-1 Mumbai)
- Single AZ deployment with daily backups
- CloudFront CDN for static assets

### Phase 2 — Multi-AZ (ap-south-1)
- PostgreSQL Multi-AZ RDS
- Redis ElastiCache Multi-AZ
- Auto-scaling group for API instances

### Phase 3 — Multi-Region
```
Primary:   ap-south-1 (Mumbai)     — Read/Write
Secondary: us-east-1 (Virginia)    — Read Replicas
Edge:      CloudFront (Global)     — Static + API cache

DNS:       Route53 latency-based routing
Database:  RDS Cross-Region Read Replicas
Cache:     Redis Global Datastore
```

---

## 8. Disaster Recovery Strategy

| Component | RPO | RTO | Strategy |
|-----------|-----|-----|----------|
| PostgreSQL | 1 min | 15 min | WAL archiving, automated failover |
| Redis | 5 min | 5 min | Redis Cluster with sentinel |
| Application | 0 | 2 min | Multi-instance, health checks |
| File Storage | 0 | 0 | S3 cross-region replication |
| Secrets | 0 | 5 min | AWS Secrets Manager, encrypted at rest |

### Incident Response Runbook
1. Automated PagerDuty alert on health check failure
2. Auto-failover for database and cache
3. Manual DNS switchover for catastrophic region failure
4. Post-incident review within 24 hours

---

## 9. Observability Stack

### Logging
- **Structured JSON logs** (Winston/Pino)
- Correlation IDs across all requests
- Log levels: ERROR → WARN → INFO → DEBUG
- Shipped to: CloudWatch Logs / ELK Stack

### Metrics
- **Prometheus** format exported via `/metrics`
- RED metrics: Rate, Errors, Duration
- Business metrics: Orders/min, Revenue/hour, Active storefronts
- **Grafana** dashboards

### Tracing
- **OpenTelemetry** instrumentation
- Distributed trace propagation (W3C Trace Context)
- Trace sampling: 100% errors, 10% success
- Backend: Jaeger / AWS X-Ray

### Health Checks
- `/health/live` — process alive
- `/health/ready` — database + redis connected
- `/health/startup` — migrations applied

---

## 10. Scaling Roadmap

### Phase 1: MVP (0–50 Influencers)
- Single NestJS instance
- PostgreSQL (single node)
- Redis (single node)
- Docker Compose deployment
- **Target: 1,000 RPM**

### Phase 2: Growth (50–10,000 Influencers)
- 3 API instances behind load balancer
- PostgreSQL with read replicas
- Redis Cluster (3 nodes)
- BullMQ workers (2 instances)
- CDN for storefront pages
- **Target: 50,000 RPM**

### Phase 3: Scale (10,000+ Influencers)
- Kubernetes (EKS) with HPA
- Extract Analytics & Payment microservices
- PostgreSQL partitioning (by date for analytics)
- Elasticsearch for product search
- Event streaming (Kafka/SQS)
- **Target: 500,000+ RPM**

---

## 11. Development Phases

### Phase 1 — Foundation (Weeks 1–4)
- Project scaffolding & CI/CD
- Database schema & migrations
- Auth module (JWT, RBAC)
- User management
- Category & Brand CRUD

### Phase 2 — Core Commerce (Weeks 5–8)
- Product & Variant management
- Storefront engine
- Order lifecycle
- Payment integration (Razorpay/Stripe)
- Affiliate tracking

### Phase 3 — Intelligence (Weeks 9–12)
- Analytics event ingestion
- Dashboard aggregations
- Admin panel APIs
- Influencer dashboard APIs
- Notification system

### Phase 4 — Scale & Polish (Weeks 13–16)
- Caching layer
- Background job optimization
- Load testing & optimization
- Monitoring & alerting
- Documentation & API specs

---

## 12. Security Checklist

- [x] JWT with short expiry (15min access, 7d refresh)
- [x] Password hashing (Argon2id)
- [x] RBAC with guard decorators
- [x] Rate limiting (100 req/min unauthenticated, 300 authenticated)
- [x] CORS configuration (whitelist origins)
- [x] Helmet.js security headers
- [x] Input validation (class-validator + class-transformer)
- [x] SQL injection prevention (Prisma parameterized)
- [x] File upload validation (type, size, virus scan)
- [x] Payment webhook HMAC verification
- [x] Idempotency keys for payment operations
- [x] Audit logging for admin operations
- [x] Secrets in environment variables (never in code)
- [x] HTTPS only (HSTS header)
- [x] Dependency vulnerability scanning (npm audit, Snyk)

---

## 13. DevOps Considerations

### Container Strategy
- Multi-stage Docker builds (build → prune → production)
- Separate containers: API, Worker, Migration
- Health check endpoints for orchestrator

### CI/CD Pipeline
```
Push → Lint → Test → Build → Security Scan → Deploy Staging → Smoke Test → Deploy Production
```

### Environment Strategy
- `development` — local Docker Compose
- `staging` — mirrors production, synthetic data
- `production` — auto-scaling, monitoring

### Infrastructure as Code
- Terraform for AWS resources
- Docker Compose for local development
- Kubernetes manifests for production (Phase 2+)
