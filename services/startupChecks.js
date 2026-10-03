// Prints a short sign-in health report at boot, so a bad Railway setting shows up in the logs
// instead of as a mysterious "it won't let me in".
const config = require('../config');
const DataService = require('./dataService');
const DbService = require('./dbService');

const hostOf = (u) => { try { return new URL(u).hostname; } catch { return String(u || '').replace(/^https?:\/\//, '').split('/')[0]; } };

async function reportSigninSetup() {
  const lines = [];
  const warn = (m) => lines.push('  ! ' + m);
  const ok = (m) => lines.push('  - ' + m);

  try {
    const users = await (config.database.useDatabase ? new DbService('users') : new DataService(config.paths.usersFile)).findAll();
    ok(`${users.length} admin account${users.length === 1 ? '' : 's'}: ${users.map((u) => u.username + (u.totpEnabled ? ' (one-time code)' : '')).join(', ') || 'none'}`);
    if (!process.env.ADMIN_PASSWORD) ok('ADMIN_PASSWORD is not set (only matters the first time the site starts)');
    else ok('ADMIN_PASSWORD is only used when the site is first set up. To change it later, set RESET_ADMIN_PASSWORD=true, redeploy, sign in, then remove that variable');
  } catch (e) { warn('Could not read admin accounts: ' + e.message); }

  if (config.isProduction) {
    const publicHost = hostOf(process.env.SITE_URL) || hostOf(process.env.RAILWAY_PUBLIC_DOMAIN);
    const rp = config.webauthn.rpID;
    if (!process.env.WEBAUTHN_RP_ID) warn(`WEBAUTHN_RP_ID is not set, so passkeys are tied to "${rp}". Passkeys only work on that address. Password and one-time-code sign-in work anywhere.`);
    if (publicHost && rp && publicHost !== rp && !publicHost.endsWith('.' + rp)) warn(`Passkeys are tied to "${rp}" but the site address is "${publicHost}". Passkeys will fail; password and one-time-code sign-in still work.`);
    if (!process.env.SITE_URL) warn('SITE_URL is not set (used for the sitemap and social previews).');
    if (!config.database.useDatabase) warn('No DATABASE_URL: accounts and sessions are stored in files and need a /data volume to survive a redeploy.');
    if (!process.env.DATA_DIR) warn('DATA_DIR is not set: uploaded images will be lost on redeploy unless it points at a volume (for example /data).');
  }
  console.log('Sign-in setup:\n' + lines.join('\n'));
}

module.exports = { reportSigninSetup };
