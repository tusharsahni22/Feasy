import { asyncHandler } from '../utils/asyncHandler.js';
import { getSettings } from '../services/settingsService.js';
import { env, isWhatsAppConfigured, isSmsConfigured } from '../config/env.js';
import { DEFAULT_REMINDER_TEMPLATE } from '../models/Settings.js';

// GET /api/settings
export const getSettingsHandler = asyncHandler(async (req, res) => {
  const s = await getSettings();
  res.json({
    instituteName: s.instituteName,
    businessType: s.businessType || 'education',
    customLabels: s.customLabels || {},
    currency: s.currency,
    reminderTemplate: s.reminderTemplate,
    reminderLeadDays: s.reminderLeadDays,
    defaultTemplate: DEFAULT_REMINDER_TEMPLATE,
    messaging: {
      whatsapp: {
        configured: isWhatsAppConfigured(),
        templateName: env.whatsapp.templateName || null,
      },
      sms: {
        configured: isSmsConfigured(),
        provider: env.sms.provider || null,
      },
      defaultCountryCode: env.defaultCountryCode,
    },
  });
});

// PUT /api/settings
export const updateSettingsHandler = asyncHandler(async (req, res) => {
  const s = await getSettings();
  const { instituteName, businessType, customLabels, currency, reminderTemplate, reminderLeadDays } = req.body;
  if (instituteName !== undefined) s.instituteName = instituteName;
  if (businessType !== undefined) s.businessType = businessType;
  if (customLabels !== undefined) s.customLabels = customLabels;
  if (currency !== undefined) s.currency = currency;
  if (reminderTemplate !== undefined) s.reminderTemplate = reminderTemplate;
  if (reminderLeadDays !== undefined) s.reminderLeadDays = reminderLeadDays;
  await s.save();
  res.json({
    instituteName: s.instituteName,
    businessType: s.businessType,
    customLabels: s.customLabels || {},
    currency: s.currency,
    reminderTemplate: s.reminderTemplate,
    reminderLeadDays: s.reminderLeadDays,
  });
});
