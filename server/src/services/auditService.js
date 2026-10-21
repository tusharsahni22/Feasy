import AuditLog from '../models/AuditLog.js';
import User from '../models/User.js';

/**
 * Humanize details object into a clear, non-JSON description.
 */
function humanizeDetails(action = '', details = null) {
  if (!details) return '';
  if (typeof details === 'string') return details;

  if (action.includes('attendance')) {
    const studentName = details.studentName || 'Member';
    const act = details.action === 'checked_out' ? 'Checked out' : 'Checked in';
    return `${act} ${studentName}${details.barcode ? ` (${details.barcode})` : ''}`;
  }
  if (action.includes('discount')) {
    const typeLabel = details.discountType === 'percent' ? `${details.value}%` : `₹${details.value}`;
    return `Created discount code "${details.code || ''}" (${typeLabel} off)`;
  }
  if (action.includes('diet')) {
    const member = details.studentName || details.student || 'Member';
    const plan = details.dietPlan || details.title || 'Diet Plan';
    return `Assigned diet "${plan}" to ${member}`;
  }

  // Generic fallback: format key values cleanly
  const parts = Object.entries(details)
    .filter(([_, v]) => v !== undefined && v !== null && v !== '')
    .map(([k, v]) => `${k}: ${v}`);
  return parts.length ? parts.join(', ') : '';
}

/**
 * Log an audit action safely in the background.
 * @param {Object} params
 * @param {string|ObjectId} params.tenantId
 * @param {Object} [params.user] - req.user object
 * @param {string} params.action - e.g. 'member.create', 'payment.create'
 * @param {string} params.entityType - e.g. 'Member', 'Payment'
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

    // Resolve user details if user object only had _id or if missing name
    let userName = user?.name || '';
    let userEmail = user?.email || '';
    let userRole = user?.role || '';

    if (user?._id && (!userName || userName === 'System')) {
      const u = await User.findById(user._id).select('name email role').lean();
      if (u) {
        userName = u.name;
        userEmail = u.email;
        userRole = u.role;
      }
    }

    await AuditLog.create({
      tenantId,
      userId: user?._id,
      userName: userName || 'System',
      userEmail,
      userRole,
      action,
      entityType: entityType === 'Student' ? 'Member' : entityType,
      entityId: String(entityId || ''),
      description: description || humanizeDetails(action, changes),
      changes,
      ip,
    });
  } catch (err) {
    // Non-blocking: fail quietly with a console warning so core business flow isn't interrupted
    console.warn('[AuditLog Error]', err.message);
  }
}

// Alias for convenience
export const recordAudit = async ({
  tenantId,
  userId,
  user,
  action,
  entity,
  entityType,
  entityId,
  details,
  changes,
  ipAddress,
  ip,
}) => {
  const finalDesc =
    typeof details === 'string'
      ? details
      : humanizeDetails(action, details || changes);

  return logAudit({
    tenantId,
    user: user || (userId ? { _id: userId } : null),
    action: action || 'action',
    entityType: entityType || entity || 'General',
    entityId,
    description: finalDesc,
    changes: changes || details,
    ip: ip || ipAddress || '',
  });
};
