#!/usr/bin/env node
/**
 * backend/scripts/generate-admin-password-hashes.mjs
 * 
 * Generates PBKDF2 password hashes for admin users.
 * Run this script to generate hashes for testing.
 * 
 * Usage:
 *   node scripts/generate-admin-password-hashes.mjs
 */

import crypto from 'crypto';

function hashPassword(password) {
  const salt = crypto.randomBytes(32);
  const hash = crypto.pbkdf2Sync(password, salt, 100000, 64, 'sha256');
  const combined = Buffer.concat([salt, hash]);
  return combined.toString('base64');
}

const adminEmails = [
  'kidabixson@gmail.com',
  'yusuphshitambala@gmail.com'
];

const testPassword = 'testing123'; // Change this to your desired password

console.log('='.repeat(80));
console.log('Admin Password Hash Generator');
console.log('='.repeat(80));
console.log(`\nGenerating hashes for password: "${testPassword}"\n`);

// Generate hashes
const hashes = adminEmails.map(email => {
  const hash = hashPassword(testPassword);
  return { email, hash };
});

// Output SQL statements
console.log('SQL Statements to update admin_users:\n');
console.log('(Run these against your Supabase admin_users table)\n');

hashes.forEach(({ email, hash }) => {
  console.log(`UPDATE admin_users SET password_hash = '${hash}', auth_method = 'password' WHERE email = '${email}';`);
});

console.log('\n' + '='.repeat(80));
console.log('⚠️  IMPORTANT SECURITY NOTES:');
console.log('='.repeat(80));
console.log('1. Each run generates DIFFERENT hashes (due to random salt)');
console.log('2. Keep the generated hashes - do not regenerate');
console.log('3. Only use test passwords like "testing123" for development');
console.log('4. Use strong passwords (20+ characters) in production');
console.log('5. Store password hashes securely - never share or commit them');
console.log('6. The default password for testing: testing123');
console.log('='.repeat(80) + '\n');
