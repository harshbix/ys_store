// backend/src/utils/password.js
// Password hashing and verification utilities for admin authentication

import crypto from 'crypto';

/**
 * Simple secure password verification using timing-safe comparison
 * For production, this should use bcrypt or argon2
 * For now, we'll use PBKDF2 for deterministic verification
 */

export function hashPassword(password) {
  // Create a salt
  const salt = crypto.randomBytes(32);
  
  // Hash password with PBKDF2
  const hash = crypto.pbkdf2Sync(password, salt, 100000, 64, 'sha256');
  
  // Return salt + hash as base64 for storage
  const combined = Buffer.concat([salt, hash]);
  return combined.toString('base64');
}

export function verifyPassword(password, passwordHash) {
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
