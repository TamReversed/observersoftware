#!/usr/bin/env node
/**
 * Sets a new password for an admin account. The password is typed at a hidden prompt (or piped in), so it never
 * appears in your shell history or on screen.
 *
 *   Local:    node scripts/set-password.js admin
 *   Railway:  railway run node scripts/set-password.js admin
 *
 * Prefer not to use a terminal? In Railway set RESET_ADMIN_PASSWORD=true and ADMIN_PASSWORD=<new password>,
 * redeploy, sign in, then delete RESET_ADMIN_PASSWORD.
 */
require('./_use-public-db');
const readline = require('readline');
const bcrypt = require('bcrypt');
const DataService = require('../services/dataService');
const DbService = require('../services/dbService');
const config = require('../config');

const username = process.argv[2];
if (!username) { console.error('Usage: node scripts/set-password.js <username>'); process.exit(1); }
const users = config.database.useDatabase ? new DbService('users') : new DataService(config.paths.usersFile);

function ask(prompt) {
  return new Promise((resolve) => {
    if (!process.stdin.isTTY) { // piped input
      let buf = ''; process.stdin.on('data', (d) => (buf += d)); process.stdin.on('end', () => resolve(buf.split('\n')[0].trim()));
      return;
    }
    const rl = readline.createInterface({ input: process.stdin, output: process.stdout, terminal: true });
    const write = rl._writeToOutput;
    process.stdout.write(prompt);
    rl._writeToOutput = (s) => { if (s.includes('\n') || s.includes('\r')) write.call(rl, s); }; // hide what is typed
    rl.question('', (a) => { rl._writeToOutput = write; rl.close(); process.stdout.write('\n'); resolve(a); });
  });
}

(async () => {
  const all = await users.findAll();
  const user = all.find((u) => u.username === username);
  if (!user) { console.error(`No user named "${username}". Users: ${all.map((u) => u.username).join(', ') || '(none)'}`); process.exit(1); }
  const a = await ask('New password (12+ characters recommended): ');
  if (a.length < 8) { console.error('Password must be at least 8 characters. Nothing changed.'); process.exit(1); }
  if (process.stdin.isTTY) { const b = await ask('Type it again: '); if (a !== b) { console.error('Those did not match. Nothing changed.'); process.exit(1); } }
  await users.updateById(user.id, { password: await bcrypt.hash(a, 12) });
  console.log(`Password updated for "${username}".` + (user.totpEnabled ? ' Note: this account uses one-time codes; run reset-2fa.js to let the password work.' : ''));
  process.exit(0);
})().catch((e) => { console.error(e); process.exit(1); });
