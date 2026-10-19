import mongoose from 'mongoose';

/** A fee payment/deposit recorded against a student. */
const paymentSchema = new mongoose.Schema(
  {
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
  },
  { timestamps: true }
);

export default mongoose.model('Payment', paymentSchema);
