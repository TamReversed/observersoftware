#!/usr/bin/env node
/**
 * Emergency reset: turns off one-time-code sign-in for an account and clears any lockout, so you can
 * sign in with the password again. Use this if you lose Dashlane access AND your recovery codes.
 *
 *   Local (JSON files):  node scripts/reset-2fa.js admin
 *   Railway (Postgres):  railway run node scripts/reset-2fa.js admin
 *
 * It needs shell access to the project/database, which is the point: only someone who can already
 * control the server can run it.
 */
require('./_use-public-db');
const DataService = require('../services/dataService');
const DbService = require('../services/dbService');
const config = require('../config');

const username = process.argv[2];
if (!username) { console.error('Usage: node scripts/reset-2fa.js <username>'); process.exit(1); }

const users = config.database.useDatabase ? new DbService('users') : new DataService(config.paths.usersFile);

(async () => {
  const all = await users.findAll();
  const user = all.find((u) => u.username === username);
  if (!user) { console.error(`No user named "${username}". Users: ${all.map((u) => u.username).join(', ') || '(none)'}`); process.exit(1); }
  await users.updateById(user.id, { totpEnabled: false, totpSecret: null, totpRecovery: [], totpLastStep: 0, totpFailures: 0, totpLockedUntil: null });
  console.log(`One-time codes are now OFF for "${username}". Sign in with your password, then set them up again.`);
  process.exit(0);
})().catch((e) => { console.error(e); process.exit(1); });
