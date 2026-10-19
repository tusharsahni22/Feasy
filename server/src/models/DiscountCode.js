import mongoose from 'mongoose';

/**
 * Discount code / coupon for memberships and fee collections.
 */
const discountCodeSchema = new mongoose.Schema(
  {
    tenantId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Tenant',
      required: true,
      index: true,
    },
    code: {
      type: String,
      required: true,
      uppercase: true,
      trim: true,
    },
    description: {
      type: String,
      trim: true,
      default: '',
    },
    discountType: {
      type: String,
      enum: ['percentage', 'flat'],
      default: 'flat', // 'flat' is ₹ amount, 'percentage' is % off
    },
    value: {
      type: Number,
      required: true,
      min: 0,
    },
    minOrderAmount: {
      type: Number,
      default: 0,
    },
    maxDiscountAmount: {
      type: Number,
      default: 0, // 0 = unlimited cap for percentage
    },
    validTill: {
      type: Date,
    },
    usageLimit: {
      type: Number,
      default: 0, // 0 = unlimited
    },
    usageCount: {
      type: Number,
      default: 0,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

discountCodeSchema.index({ tenantId: 1, code: 1 }, { unique: true });

export default mongoose.model('DiscountCode', discountCodeSchema);
