import mongoose from 'mongoose';
import { PLAN_MONTHS } from '../utils/subscription.js';

/**
 * A student enrolled at the institute. Fee fields are stored as a snapshot
 * taken at enrolment/edit time (so later fee changes don't silently rewrite
 * historical figures). Subscription window is tracked via start/end dates.
 */
const studentSchema = new mongoose.Schema(
  {
    tenantId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Tenant',
      required: true,
      index: true,
    },
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

    // Medical & Schedule
    bloodGroup: {
      type: String,
      enum: ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-', 'Unknown'],
      default: 'Unknown',
    },
    shiftTiming: {
      type: String,
      trim: true,
      default: 'General (06:00 AM - 10:00 PM)',
    },

    // Barcode / RFID / Member ID Card code
    barcode: {
      type: String,
      trim: true,
      index: true,
    },

    // Diet / Workout Plan
    dietPlan: {
      title: { type: String, trim: true, default: '' },
      caloriesTarget: { type: Number, default: 0 },
      details: { type: String, default: '' }, // Markdown / text formatted meals
      pdfUrl: { type: String, default: '' },
      updatedAt: { type: Date, default: Date.now },
    },
  },
  { timestamps: true }
);

// Text-ish search helpers
studentSchema.index({ name: 1 });
studentSchema.index({ subscriptionEnd: 1 });
studentSchema.index({ tenantId: 1, barcode: 1 });

export default mongoose.model('Student', studentSchema);
