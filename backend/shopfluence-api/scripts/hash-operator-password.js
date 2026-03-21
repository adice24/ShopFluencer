#!/usr/bin/env node
/**
 * Generate a bcrypt hash for platform_operator_credentials.password_hash
 * Usage: node scripts/hash-operator-password.js "YourStrongPassword"
 */
const bcrypt = require('bcryptjs');
const pwd = process.argv[2];
if (!pwd || pwd.length < 8) {
  console.error('Usage: node scripts/hash-operator-password.js "<password min 8 chars>"');
  process.exit(1);
}
console.log(bcrypt.hashSync(pwd, 10));
