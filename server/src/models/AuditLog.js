import mongoose from 'mongoose';

/**
 * AuditLog records key state changes and actions across a tenant:
 * Who did it, what action was taken, on which entity, and what changed.
 */
const auditLogSchema = new mongoose.Schema(
  {
    tenantId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Tenant',
      required: true,
      index: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: false,
    },
    userName: {
      type: String,
      default: 'System',
    },
    userEmail: {
      type: String,
      default: '',
    },
    userRole: {
      type: String,
      default: '',
    },
    action: {
      type: String,
      required: true, // e.g. 'student.create', 'student.update', 'payment.create', 'payment.delete', 'user.invite'
      index: true,
    },
    entityType: {
      type: String,
      required: true, // e.g. 'Student', 'Payment', 'User', 'ClassPlan', 'Settings'
      index: true,
    },
    entityId: {
      type: String,
      default: '',
    },
    description: {
      type: String,
      required: true,
    },
    changes: {
      type: mongoose.Schema.Types.Mixed,
      default: null, // e.g. { before: { status: 'inactive' }, after: { status: 'active' } }
    },
    ip: {
      type: String,
      default: '',
    },
  },
  { timestamps: true }
);

auditLogSchema.index({ tenantId: 1, createdAt: -1 });

export default mongoose.model('AuditLog', auditLogSchema);

