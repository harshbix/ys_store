import crypto from 'crypto';

// This is the exact verifyPassword function from the backend
function verifyPassword(password, passwordHash) {
  if (!passwordHash) return false;
  
  try {
    const combined = Buffer.from(passwordHash, 'base64');
    const salt = combined.slice(0, 32);
    const storedHash = combined.slice(32);
    
    // Hash the provided password with the same salt
    const hash = crypto.pbkdf2Sync(password, salt, 100000, 64, 'sha256');
    
    // Use timing-safe comparison
    return crypto.timingSafeEqual(hash, storedHash);
  } catch (err) {
    return false;
  }
}

const passwordHash = 'b6B7sCRgkYrTM8C1mmLor7ry+Kx68TvC7zBM212OJTA+mFCEwJHdGRGcMQMIlEinQXBfMdTme4i8Pa4mhIYK5Ggpw0sdVRFkVSH3i34J1ZGfhiyXZ/X5GX6BEh6TtT2I';

console.log('Testing password verification...\n');
console.log('Testing with password: 12345678');
const result = verifyPassword('12345678', passwordHash);
console.log('Result:', result ? '✓ VERIFIED' : '✗ FAILED');

console.log('\nTesting with wrong password: wrongpassword');
const wrongResult = verifyPassword('wrongpassword', passwordHash);
console.log('Result:', wrongResult ? '✗ INCORRECTLY VERIFIED' : '✓ CORRECTLY REJECTED');
