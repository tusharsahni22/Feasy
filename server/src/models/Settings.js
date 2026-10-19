import mongoose from 'mongoose';
import { env } from '../config/env.js';

export const DEFAULT_REMINDER_TEMPLATE =
  'Hello {parentName}, this is a reminder from {institute}. ' +
  "{studentName}'s subscription ({class}) has {days} day(s) left " +
  'and renews on {endDate}. Amount: {currency}{fee}. ' +
  'Kindly complete payment to continue services. Thank you.';

/**
 * Single-document settings for the organization/tenant. Accessed via key: 'app'.
 */
const settingsSchema = new mongoose.Schema(
  {
    key: { type: String, default: 'app', unique: true },
    instituteName: { type: String, default: env.instituteName },
    businessType: {
      type: String,
      enum: ['education', 'gym', 'library', 'general'],
      default: env.businessType || 'education',
    },
    currency: { type: String, default: 'INR' },
    reminderTemplate: { type: String, default: DEFAULT_REMINDER_TEMPLATE },
    // A subscription with <= this many days left is treated as "expiring soon".
    reminderLeadDays: { type: Number, default: 7, min: 1 },
  },
  { timestamps: true }
);

export default mongoose.model('Settings', settingsSchema);
