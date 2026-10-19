import dotenv from 'dotenv';

dotenv.config();

/**
 * Centralised, typed access to environment configuration for Feasy SaaS.
 * Everything has a sensible default so the app boots even without a .env file.
 */
export const env = {
  port: Number(process.env.PORT) || 5000,
  nodeEnv: process.env.NODE_ENV || 'development',
  mongoUri: process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/feasy',
  // Build indexes automatically. Fine for small deployments; set
  // MONGO_AUTO_INDEX=false on very large Atlas collections and manage indexes explicitly.
  mongoAutoIndex: process.env.MONGO_AUTO_INDEX !== 'false',
  clientUrl: process.env.CLIENT_URL || 'http://localhost:5173',
  // Absolute path to the built client (client/dist). Blank = auto-detect relative to server.
  clientDist: process.env.CLIENT_STATIC_DIR || '',
  instituteName: process.env.INSTITUTE_NAME || 'Feasy Workspace',
  businessType: process.env.BUSINESS_TYPE || 'education',
  defaultCountryCode: process.env.DEFAULT_COUNTRY_CODE || '91',

  whatsapp: {
    token: process.env.WHATSAPP_TOKEN || '',
    phoneNumberId: process.env.WHATSAPP_PHONE_NUMBER_ID || '',
    apiVersion: process.env.WHATSAPP_API_VERSION || 'v20.0',
    templateName: process.env.WHATSAPP_TEMPLATE_NAME || '',
    templateLang: process.env.WHATSAPP_TEMPLATE_LANG || 'en',
  },

  sms: {
    provider: process.env.SMS_PROVIDER || '',
    apiKey: process.env.SMS_API_KEY || '',
    senderId: process.env.SMS_SENDER_ID || '',
  },
};

export const isWhatsAppConfigured = () =>
  Boolean(env.whatsapp.token && env.whatsapp.phoneNumberId);

export const isSmsConfigured = () =>
  Boolean(env.sms.provider && env.sms.apiKey);
