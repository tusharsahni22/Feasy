import Settings from '../models/Settings.js';

/** Fetch the singleton settings document, creating it with defaults if absent. */
export async function getSettings() {
  let doc = await Settings.findOne({ key: 'app' });
  if (!doc) doc = await Settings.create({ key: 'app' });
  return doc;
}
