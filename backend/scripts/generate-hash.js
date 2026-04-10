const crypto = require('crypto');

function hashPassword(password) {
  const salt = crypto.randomBytes(32);
  const hash = crypto.pbkdf2Sync(password, salt, 100000, 64, 'sha256');
  const combined = Buffer.concat([salt, hash]);
  return combined.toString('base64');
}

const password = '12345678';
const email = 'yusuphshitambala@gmail.com';
const hash = hashPassword(password);

console.log('Email:', email);
console.log('Password:', password);
console.log('Password Hash:', hash);
console.log('\nSQL UPDATE statement:');
console.log(`UPDATE admin_users SET password_hash = '${hash}' WHERE email = '${email}';`);
