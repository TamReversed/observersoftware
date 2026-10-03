#!/usr/bin/env node
/**
 * Lists every API route that can change data or reveal admin data, and whether it is
 * protected by login (requireAuth) and CSRF (validateCsrfToken). Run: node scripts/audit-routes.js
 * Exits non-zero if an /admin route is missing login, or a state-changing admin route is missing CSRF.
 */
process.env.NODE_ENV = process.env.NODE_ENV || 'development';
const router = require('../routes');

const rows = [];
function walk(stack, prefix) {
  for (const layer of stack) {
    if (layer.route) {
      const names = layer.route.stack.map((l) => l.name || '');
      for (const method of Object.keys(layer.route.methods)) {
        rows.push({ method: method.toUpperCase(), path: prefix + layer.route.path, auth: names.includes('requireAuth') || names.includes('requireAdmin'), admin: names.includes('requireAdmin'), csrf: names.includes('validateCsrfToken') });
      }
    } else if (layer.name === 'router' && layer.handle.stack) {
      const m = layer.regexp.source.match(/^\^((?:\\\/[^\\?()]+)+)/);
      walk(layer.handle.stack, prefix + (m ? m[1].replace(/\\\//g, '/') : ''));
    }
  }
}
walk(router.stack, '');

const problems = [];
const open = [];
for (const r of rows) {
  const admin = /\/admin(\/|$)/.test(r.path) || /^\/api\/auth\/users/.test(r.path) || /^\/api\/upload/.test(r.path);
  const mutates = r.method !== 'GET';
  if (admin && !r.auth) problems.push(`${r.method} ${r.path}: admin route without login`);
  // these hold other people's data or control accounts, so an editor must never reach them
  const adminOnly = /^\/api\/auth\/users|\/admin\/(messages|settings|changelog|export)/.test(r.path);
  if (adminOnly && !r.admin) problems.push(`${r.method} ${r.path}: should be admin-only (requireAdmin)`);
  if (admin && mutates && !r.csrf) problems.push(`${r.method} ${r.path}: changes data without CSRF check`);
  if (!admin && mutates && !r.auth) open.push(`${r.method} ${r.path}${r.csrf ? '  (CSRF)' : ''}`);
}
console.log(`${rows.length} routes checked.\n`);
console.log('Public routes that accept data without a login - each should be intended:');
console.log('  (passkey register/start checks the password or session inside its controller)');
open.forEach((o) => console.log('  ' + o));
console.log(problems.length ? '\nPROBLEMS:\n  ' + problems.join('\n  ') : '\nNo admin route is missing login or CSRF protection.');
process.exit(problems.length ? 1 : 0);
