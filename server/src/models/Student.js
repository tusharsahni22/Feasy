import mongoose from 'mongoose';
import { PLAN_MONTHS } from '../utils/subscription.js';

/**
 * A student enrolled at the institute. Fee fields are stored as a snapshot
 * taken at enrolment/edit time (so later fee changes don't silently rewrite
 * historical figures). Subscription window is tracked via start/end dates.
 */
const studentSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    parentName: { type: String, required: true, trim: true },
    // Stored as entered; normalised to E.164-ish only when messaging.
    parentPhone: { type: String, required: true, trim: true },
    gender: { type: String, enum: ['male', 'female', 'other'], default: 'other' },

    classPlan: { type: mongoose.Schema.Types.ObjectId, ref: 'ClassPlan', required: true },
    subjects: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Subject' }],

    // Fee snapshot (₹/month)
    baseFee: { type: Number, default: 0 },
    subjectsFee: { type: Number, default: 0 },
    monthlyFee: { type: Number, default: 0 },

    // Subscription
    plan: { type: String, enum: Object.keys(PLAN_MONTHS), default: 'monthly' },
    subscriptionStart: { type: Date, default: () => new Date() },
    subscriptionEnd: { type: Date, required: true },

    status: { type: String, enum: ['active', 'inactive', 'paused'], default: 'active' },
    notes: { type: String, trim: true },
  },
  { timestamps: true }
);

// Text-ish search helpers
studentSchema.index({ name: 1 });
studentSchema.index({ subscriptionEnd: 1 });

export default mongoose.model('Student', studentSchema);
