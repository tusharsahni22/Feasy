import Settings, { DEFAULT_REMINDER_TEMPLATE } from '../models/Settings.js';
import Tenant from '../models/Tenant.js';

/**
 * Fetch settings for a tenant if tenantId is provided, or the global fallback.
 */
export async function getSettings(tenantId) {
  if (tenantId) {
    const tenant = await Tenant.findById(tenantId);
    if (tenant) {
      return {
        instituteName: tenant.name,
        businessType: tenant.businessType || 'education',
        customLabels: tenant.customLabels || {},
        currency: tenant.currency || 'INR',
        reminderTemplate: tenant.reminderTemplate || DEFAULT_REMINDER_TEMPLATE,
        reminderLeadDays: tenant.reminderLeadDays || 7,
        branding: tenant.branding || {},
      };
    }
  }

  let doc = await Settings.findOne({ key: 'app' });
  if (!doc) doc = await Settings.create({ key: 'app' });
  return doc;
}
