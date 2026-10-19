import mongoose from 'mongoose';

/** A fee payment/deposit recorded against a student. */
const paymentSchema = new mongoose.Schema(
  {
    tenantId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Tenant',
      required: true,
      index: true,
    },
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Student',
      required: true,
      index: true,
    },
    amount: { type: Number, required: true, min: 0 },
    method: {
      type: String,
      enum: ['cash', 'upi', 'card', 'bank', 'other'],
      default: 'cash',
    },
    // The month this deposit is meant to cover, as "YYYY-MM".
    forMonth: { type: String },
    note: { type: String, trim: true },
    paidAt: { type: Date, default: () => new Date(), index: true },
    // True when this payment also renewed/extended the subscription.
    renewed: { type: Boolean, default: false },
    discountCode: { type: String, trim: true, uppercase: true, default: '' },
    discountAmount: { type: Number, default: 0 },
    originalAmount: { type: Number, default: 0 },
  },
  { timestamps: true }
);

export default mongoose.model('Payment', paymentSchema);
