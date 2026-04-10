import crypto from 'crypto';

/**
 * Generate PBKDF2 password hashes for admin users
 * Run with: node backend/generate-admin-hashes.mjs
 */

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

const password = 'testing123';

console.log('Generating PBKDF2 password hashes for admin users...\n');
console.log(`Password: ${password}\n`);
console.log('=' .repeat(80));
console.log('SQL UPDATE STATEMENTS');
console.log('=' .repeat(80));
console.log();

adminEmails.forEach((email) => {
  const hash = hashPassword(password);
  console.log(`UPDATE admin_users SET password_hash = '${hash}' WHERE email = '${email}';`);
  console.log();
});

console.log('=' .repeat(80));
console.log('\nHash Details:');
console.log('=' .repeat(80));

adminEmails.forEach((email) => {
  const hash = hashPassword(password);
  console.log(`\nEmail: ${email}`);
  console.log(`Hash:  ${hash}`);
  console.log(`Length: ${hash.length} characters`);
});

console.log('\n' + '=' .repeat(80));
console.log('NOTE: Each run generates different hashes due to random salt.');
console.log('Use the hashes from your first complete run for consistency.');
console.log('=' .repeat(80));
