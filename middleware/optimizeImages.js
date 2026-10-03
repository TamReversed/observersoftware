// Serves a resized WebP copy of PNG/JPEG images to browsers that accept WebP.
// - Phone photos uploaded in the CMS can be several MB; this typically cuts them by 80-95%.
// - Uses the original's modified time in the cache key, so replacing a file replaces its optimized copy.
// - Strips metadata such as GPS location from photos (output never carries EXIF).
// - If the optional `sharp` library is unavailable, or anything goes wrong, the original file is served.
const fs = require('fs');
const os = require('os');
const path = require('path');
const crypto = require('crypto');
const config = require('../config');

let sharp = null;
try { sharp = require('sharp'); } catch { /* optional: originals are served instead */ }

const MAX_WIDTH = 1600;
const ROOTS = [
  { mount: '/uploads', dir: path.resolve(config.paths.uploadsDir) },
  { mount: '/assets', dir: path.resolve(__dirname, '..', 'public', 'assets') }
];
// Brand files, icons, social cards and fonts are served exactly as stored
const SKIP = /^\/assets\/(brand|icons|og|fonts|film)\//;

let cacheDir = path.join(config.paths.dataDir, 'cache', 'images');
try { fs.mkdirSync(cacheDir, { recursive: true }); } catch { cacheDir = path.join(os.tmpdir(), 'observer-img-cache'); fs.mkdirSync(cacheDir, { recursive: true }); }

const inflight = new Map();

function locate(urlPath) {
  for (const { mount, dir } of ROOTS) {
    if (!urlPath.startsWith(mount + '/')) continue;
    const abs = path.resolve(dir, '.' + urlPath.slice(mount.length));
    if (abs.startsWith(dir + path.sep)) return abs; // never leave the folder
  }
  return null;
}

async function build(abs, out) {
  const tmp = `${out}.${process.pid}.${Date.now()}.tmp`;
  await sharp(abs, { failOn: 'none' }).rotate().resize({ width: MAX_WIDTH, withoutEnlargement: true }).webp({ quality: 80 }).toFile(tmp);
  fs.renameSync(tmp, out);
}

module.exports = function optimizeImages(req, res, next) {
  if (!sharp || req.method !== 'GET') return next();
  let urlPath;
  try { urlPath = decodeURIComponent(req.path); } catch { return next(); }
  if (!/\.(png|jpe?g)$/i.test(urlPath) || SKIP.test(urlPath)) return next();
  if (!(req.headers.accept || '').includes('image/webp')) return next();

  const abs = locate(urlPath);
  if (!abs) return next();
  let stat;
  try { stat = fs.statSync(abs); } catch { return next(); }
  if (!stat.isFile() || stat.size < 20 * 1024) return next(); // tiny files are not worth converting

  const key = crypto.createHash('sha1').update(`${urlPath}|${stat.mtimeMs}|${stat.size}|${MAX_WIDTH}`).digest('hex');
  const out = path.join(cacheDir, `${key}.webp`);
  const send = () => {
    res.set('Vary', 'Accept');
    res.set('Cache-Control', 'no-cache'); // revalidated with the ETag, same policy as other static files
    res.type('image/webp');
    res.sendFile(out, (err) => { if (err && !res.headersSent) next(); });
  };

  if (fs.existsSync(out)) return send();
  let job = inflight.get(out);
  if (!job) {
    job = build(abs, out).finally(() => inflight.delete(out));
    inflight.set(out, job);
  }
  job.then(send).catch(() => next()); // any failure: serve the original
};
