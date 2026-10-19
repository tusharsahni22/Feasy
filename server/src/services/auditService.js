import AuditLog from '../models/AuditLog.js';

/**
 * Log an audit action safely in the background.
 * @param {Object} params
 * @param {string|ObjectId} params.tenantId
 * @param {Object} [params.user] - req.user object
 * @param {string} params.action - e.g. 'member.create', 'payment.create'
 * @param {string} params.entityType - e.g. 'Student', 'Payment'
 * @param {string|ObjectId} [params.entityId]
 * @param {string} params.description
 * @param {Object} [params.changes]
 * @param {string} [params.ip]
 */
export async function logAudit({
  tenantId,
  user,
  action,
  entityType,
  entityId = '',
  description,
  changes = null,
  ip = '',
}) {
  try {
    if (!tenantId) return;
    await AuditLog.create({
      tenantId,
      userId: user?._id,
      userName: user?.name || 'System',
      userEmail: user?.email || '',
      userRole: user?.role || '',
      action,
      entityType,
      entityId: String(entityId || ''),
      description,
      changes,
      ip,
    });
  } catch (err) {
    // Non-blocking: fail quietly with a console warning so core business flow isn't interrupted
    console.warn('[AuditLog Error]', err.message);
  }
}

