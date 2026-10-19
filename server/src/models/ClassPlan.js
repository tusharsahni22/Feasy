import mongoose from 'mongoose';

/**
 * A class/grade the institute teaches (Nursery … Class 12), with its
 * flat monthly base fee. Subject add-ons are charged on top of this.
 */
const classPlanSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, unique: true, trim: true },
    // Used to keep classes in academic order (Nursery=1 … Class 12=15).
    order: { type: Number, required: true },
    baseMonthlyFee: { type: Number, required: true, min: 0, default: 0 },
  },
  { timestamps: true }
);

export default mongoose.model('ClassPlan', classPlanSchema);
