const siteContent = require('../services/siteContentService');

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

// Everything the editor needs: field definitions, live and draft values, version list
async function get(req, res) {
  res.json({ fields: siteContent.fieldMeta(), ...(await siteContent.status()) });
}

async function saveDraft(req, res) {
  const result = await siteContent.saveDraft(req.body && req.body.content);
  if (result.errors) return res.status(400).json({ error: 'Some fields need attention', errors: result.errors });
  res.json({ ok: true, ...(await siteContent.status()) });
}

async function publish(req, res) {
  const result = await siteContent.publish(req.session.username);
  if (result.errors) return res.status(400).json({ error: 'Some fields need attention', errors: result.errors });
  res.json({ ok: true, unchanged: !!result.unchanged, ...(await siteContent.status()) });
}

async function discard(req, res) {
  await siteContent.discardDraft();
  res.json({ ok: true, ...(await siteContent.status()) });
}

async function restore(req, res) {
  if (!UUID.test(req.params.id)) return res.status(400).json({ error: 'Invalid version' });
  const result = await siteContent.restoreToDraft(req.params.id);
  if (!result) return res.status(404).json({ error: 'Version not found' });
  if (result.errors) return res.status(400).json({ error: 'That version has invalid fields', errors: result.errors });
  res.json({ ok: true, ...(await siteContent.status()) });
}

module.exports = { get, saveDraft, publish, discard, restore };
