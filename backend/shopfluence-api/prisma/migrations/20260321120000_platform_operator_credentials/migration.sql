-- Platform admin login for Nest /admin/auth (bcrypt hash only; no plaintext passwords).

CREATE TABLE "platform_operator_credentials" (
    "id" UUID NOT NULL,
    "email" VARCHAR(255) NOT NULL,
    "password_hash" TEXT NOT NULL,
    "label" VARCHAR(100),
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "platform_operator_credentials_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "platform_operator_credentials_email_key" ON "platform_operator_credentials"("email");

-- Default operator (rotate password in production: update password_hash with bcrypt hash)
-- Plaintext dev password: admin123 (bcrypt cost 10)
INSERT INTO "platform_operator_credentials" ("id", "email", "password_hash", "label", "is_active", "created_at", "updated_at")
VALUES (
    gen_random_uuid(),
    'admin@shopfluence.com',
    '$2b$10$7GVbe9I9ZI.wltXq8zYb..0F.LXv1vsnaDM9rYoEc4ahxyLYjw9UK',
    'default',
    true,
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
)
ON CONFLICT ("email") DO NOTHING;
