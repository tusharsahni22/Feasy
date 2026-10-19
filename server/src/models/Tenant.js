import mongoose from 'mongoose';

const tenantSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true, lowercase: true, trim: true },
    businessType: {
      type: String,
      enum: ['education', 'gym', 'library', 'general'],
      default: 'gym',
    },
    currency: { type: String, default: 'INR' },
    customLabels: { type: Map, of: String, default: {} },
    branding: {
      logoUrl: { type: String, default: '' },
      primaryColor: { type: String, default: '#E5A93C' },
      receiptHeader: { type: String, default: '' },
      contactPhone: { type: String, default: '' },
      address: { type: String, default: '' },
    },
    status: {
      type: String,
      enum: ['active', 'suspended', 'trial'],
      default: 'active',
    },
  },
  { timestamps: true }
);

export default mongoose.model('Tenant', tenantSchema);
