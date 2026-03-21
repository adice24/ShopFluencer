-- Previous seed used a bcrypt string that did not verify against "admin123". Repair existing rows only.
UPDATE "platform_operator_credentials"
SET
    "password_hash" = '$2b$10$7GVbe9I9ZI.wltXq8zYb..0F.LXv1vsnaDM9rYoEc4ahxyLYjw9UK',
    "updated_at" = CURRENT_TIMESTAMP
WHERE
    "email" = 'admin@shopfluence.com'
    AND "password_hash" = '$2b$10$IutA1gRkH1YYqv3BI8TzfuZeOd861/I7O4.4JLtJiBJhczR2Rv/ZO';
