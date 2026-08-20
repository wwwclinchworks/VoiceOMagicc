import crypto from 'node:crypto';
import readline from 'node:readline';

const N = 32768;
const r = 8;
const p = 1;
const KEY_LENGTH = 32;
const MAXMEM = 32 * 1024 * 1024;

const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
const ask = (question) => new Promise((resolve) => rl.question(question, resolve));

try {
  const password = await ask('Admin password: ');
  if (!password) throw new Error('Password cannot be empty.');
  if (password.length < 12) throw new Error('Password must be at least 12 characters.');

  const salt = crypto.randomBytes(16);
  const derived = crypto.scryptSync(password, salt, KEY_LENGTH, { N, r, p, maxmem: MAXMEM });
  console.log(`CMS_ADMIN_PASSWORD_HASH=scrypt$${N}$${r}$${p}$${salt.toString('base64url')}$${derived.toString('base64url')}`);
} finally {
  rl.close();
}
