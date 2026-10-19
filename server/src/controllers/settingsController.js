import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiError } from '../utils/ApiError.js';
import { getSettings } from '../services/settingsService.js';
import { env, isWhatsAppConfigured, isSmsConfigured } from '../config/env.js';
import { DEFAULT_REMINDER_TEMPLATE } from '../models/Settings.js';
import Tenant from '../models/Tenant.js';

// GET /api/settings
export const getSettingsHandler = asyncHandler(async (req, res) => {
  const s = await getSettings(req.tenantId);
  res.json({
    instituteName: s.instituteName,
    businessType: s.businessType || 'education',
    customLabels: s.customLabels || {},
    currency: s.currency,
    reminderTemplate: s.reminderTemplate,
    reminderLeadDays: s.reminderLeadDays,
    branding: s.branding || {},
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
  const { instituteName, businessType, customLabels, currency, reminderTemplate, reminderLeadDays, branding } = req.body;

  if (req.tenantId) {
    const tenant = await Tenant.findById(req.tenantId);
    if (!tenant) throw new ApiError(404, 'Tenant not found');

    if (instituteName !== undefined) tenant.name = instituteName;
    if (businessType !== undefined) tenant.businessType = businessType;
    if (customLabels !== undefined) tenant.customLabels = customLabels;
    if (currency !== undefined) tenant.currency = currency;
    if (reminderTemplate !== undefined) tenant.reminderTemplate = reminderTemplate;
    if (reminderLeadDays !== undefined) tenant.reminderLeadDays = reminderLeadDays;
    if (branding !== undefined) tenant.branding = { ...tenant.branding, ...branding };
    await tenant.save();

    return res.json({
      instituteName: tenant.name,
      businessType: tenant.businessType,
      customLabels: tenant.customLabels || {},
      currency: tenant.currency,
      reminderTemplate: tenant.reminderTemplate || DEFAULT_REMINDER_TEMPLATE,
      reminderLeadDays: tenant.reminderLeadDays,
      branding: tenant.branding || {},
    });
  }

  const s = await getSettings();
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
