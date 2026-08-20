import crypto from 'node:crypto';

const password = 'test-password-1234';
const salt = crypto.randomBytes(16);
const hash = crypto.scryptSync(password, salt, 32, {
  N: 16384,
  r: 8,
  p: 1,
  maxmem: 32 * 1024 * 1024
});
if (hash.length !== 32) throw new Error('Unexpected scrypt output length.');
const verify = crypto.scryptSync(password, salt, 32, {
  N: 16384,
  r: 8,
  p: 1,
  maxmem: 32 * 1024 * 1024
});
if (!crypto.timingSafeEqual(hash, verify)) throw new Error('scrypt verification regression.');
console.log('scrypt memory regression check passed.');
