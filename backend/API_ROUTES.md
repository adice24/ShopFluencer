# ShopFluence API — Route Reference
## Base URL: `/api/v1`

---

## 🔐 Authentication
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/auth/register` | ❌ | Register new user (Admin/Influencer/Customer) |
| POST | `/auth/login` | ❌ | Login with email & password |
| POST | `/auth/refresh` | ❌ | Refresh access token using refresh token |
| POST | `/auth/logout` | ❌ | Revoke refresh token |

---

## 👤 Users
| Method | Endpoint | Auth | Role | Description |
|--------|----------|------|------|-------------|
| GET | `/users/me` | ✅ | Any | Get current user profile |
| GET | `/users` | ✅ | Admin | List all users (paginated, filterable) |
| GET | `/users/:id` | ✅ | Admin | Get user by ID |

---

## 📦 Catalog

### Categories
| Method | Endpoint | Auth | Role | Description |
|--------|----------|------|------|-------------|
| GET | `/catalog/categories` | ❌ | — | Get all active categories |
| GET | `/catalog/categories/:slug` | ❌ | — | Get category by slug |
| POST | `/catalog/categories` | ✅ | Admin | Create category |

### Brands
| Method | Endpoint | Auth | Role | Description |
|--------|----------|------|------|-------------|
| GET | `/catalog/brands` | ❌ | — | Get all brands (paginated) |
| GET | `/catalog/brands/:slug` | ❌ | — | Get brand by slug |
| POST | `/catalog/brands` | ✅ | Admin | Create brand |

### Products
| Method | Endpoint | Auth | Role | Description |
|--------|----------|------|------|-------------|
| GET | `/catalog/products` | ❌ | — | Get products (paginated, filterable) |
| GET | `/catalog/products/slug/:slug` | ❌ | — | Get product by slug |
| GET | `/catalog/products/:id` | ❌ | — | Get product by ID |
| POST | `/catalog/products` | ✅ | Admin | Create product |
| PATCH | `/catalog/products/:id` | ✅ | Admin | Update product |
| DELETE | `/catalog/products/:id` | ✅ | Admin | Soft delete product |

**Product Query Parameters:**
- `page`, `limit` — Pagination
- `search` — Full-text search
- `categoryId` — Filter by category
- `brandId` — Filter by brand
- `status` — Filter by status (ACTIVE, DRAFT, etc.)
- `minPrice`, `maxPrice` — Price range
- `featured` — Featured products only
- `sortBy` — Sort field (createdAt, basePrice, name)
- `sortOrder` — asc / desc

---

## 🏪 Storefront
| Method | Endpoint | Auth | Role | Description |
|--------|----------|------|------|-------------|
| GET | `/storefront/:slug` | ❌ | — | Get storefront by slug (public, cached) |
| POST | `/storefront` | ✅ | Influencer/Admin | Create/update storefront |
| PATCH | `/storefront/:id/status` | ✅ | Admin | Set storefront status |
| POST | `/storefront/:id/products` | ✅ | Influencer/Admin | Add product to storefront |
| DELETE | `/storefront/:id/products/:productId` | ✅ | Influencer/Admin | Remove product |

---

## 🛒 Orders
| Method | Endpoint | Auth | Role | Description |
|--------|----------|------|------|-------------|
| POST | `/orders` | ❌ | — | Create order (guest or authenticated) |
| GET | `/orders/my` | ✅ | Any | Get my orders (paginated) |
| GET | `/orders/track/:orderNumber` | ❌ | — | Track order by number (public) |
| GET | `/orders` | ✅ | Admin | Get all orders (filtered) |
| GET | `/orders/:id` | ✅ | Admin | Get order by ID |
| PATCH | `/orders/:id/status` | ✅ | Admin | Update order status |

**Order Admin Query Parameters:**
- `status` — Filter by OrderStatus
- `influencerId` — Filter by influencer
- `dateFrom`, `dateTo` — Date range

---

## 💳 Payments
| Method | Endpoint | Auth | Role | Description |
|--------|----------|------|------|-------------|
| POST | `/payments/intent` | ❌ | — | Create payment intent (idempotent) |
| POST | `/payments/webhook` | ❌ | — | Payment gateway webhook |
| POST | `/payments/:id/failure` | ❌ | — | Handle payment failure |
| GET | `/payments/order/:orderId` | ✅ | Any | Get payment history for order |

---

## 🔗 Affiliates
| Method | Endpoint | Auth | Role | Description |
|--------|----------|------|------|-------------|
| POST | `/affiliates/click` | ❌ | — | Record affiliate click (public) |
| GET | `/affiliates/conversions` | ✅ | Influencer | Get my conversions (paginated) |
| GET | `/affiliates/commissions` | ✅ | Influencer | Get commission summary |
| GET | `/affiliates/clicks` | ✅ | Influencer | Get click analytics |

---

## 📊 Analytics
| Method | Endpoint | Auth | Role | Description |
|--------|----------|------|------|-------------|
| POST | `/analytics/track` | ❌ | — | Track analytics event (public) |
| GET | `/analytics/influencer` | ✅ | Influencer | Get influencer dashboard analytics |
| GET | `/analytics/platform` | ✅ | Admin | Get platform-wide analytics |

---

## ⚙️ Admin
| Method | Endpoint | Auth | Role | Description |
|--------|----------|------|------|-------------|
| GET | `/admin/overview` | ✅ | Admin | Platform overview stats |
| GET | `/admin/influencers/pending` | ✅ | Admin | Pending influencer approvals |
| POST | `/admin/influencers/:userId/approve` | ✅ | Admin | Approve influencer |
| POST | `/admin/influencers/:userId/reject` | ✅ | Admin | Reject influencer |
| POST | `/admin/influencers/:influencerId/brands/:brandId` | ✅ | Admin | Assign brand |
| DELETE | `/admin/influencers/:influencerId/brands/:brandId` | ✅ | Admin | Remove brand |
| PATCH | `/admin/storefronts/:id/status` | ✅ | Admin | Enable/disable storefront |

---

## 🏥 Health
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/health/live` | ❌ | Liveness probe |
| GET | `/health/ready` | ❌ | Readiness probe (checks DB) |

---

## Response Format

### Success
```json
{
  "success": true,
  "statusCode": 200,
  "message": "OK",
  "data": { ... },
  "meta": {
    "total": 100,
    "page": 1,
    "limit": 20,
    "totalPages": 5,
    "hasNext": true,
    "hasPrev": false
  },
  "timestamp": "2026-02-20T10:00:00.000Z"
}
```

### Error
```json
{
  "success": false,
  "statusCode": 400,
  "message": "Validation failed",
  "errors": ["email must be an email"],
  "timestamp": "2026-02-20T10:00:00.000Z",
  "path": "/api/v1/auth/register",
  "method": "POST"
}
```
