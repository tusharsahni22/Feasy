import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiError } from '../utils/ApiError.js';
import Tenant from '../models/Tenant.js';
import User from '../models/User.js';
import Student from '../models/Student.js';
import ClassPlan from '../models/ClassPlan.js';
import Subject from '../models/Subject.js';
import Payment from '../models/Payment.js';
import ReminderLog from '../models/ReminderLog.js';

// GET /api/workspaces (SuperAdmin / Owner: list all workspaces)
export const listWorkspaces = asyncHandler(async (req, res) => {
  if (!req.user.isSuperAdmin && req.user.role !== 'owner') {
    throw new ApiError(403, 'Permission denied');
  }

  // Superadmins see all tenants; regular owners see their own
  const filter = req.user.isSuperAdmin ? {} : { _id: req.tenantId };
  const tenants = await Tenant.find(filter).lean();

  const enriched = await Promise.all(
    tenants.map(async (t) => {
      const [membersCount, plansCount, usersCount] = await Promise.all([
        Student.countDocuments({ tenantId: t._id }),
        ClassPlan.countDocuments({ tenantId: t._id }),
        User.countDocuments({ tenantId: t._id }),
      ]);
      const ownerUser = await User.findOne({ tenantId: t._id, role: 'owner' }).select('name email phone').lean();
      return {
        ...t,
        stats: {
          members: membersCount,
          plans: plansCount,
          users: usersCount,
        },
        owner: ownerUser,
      };
    })
  );

  res.json(enriched);
});

// DELETE /api/workspaces/:id (SuperAdmin / Workspace Owner: delete entire workspace and all its data)
export const deleteWorkspace = asyncHandler(async (req, res) => {
  const targetTenantId = req.params.id;

  // Check authorization: Must be superadmin OR the owner of this specific tenant
  const isSuper = Boolean(req.user.isSuperAdmin);
  const isOwnerOfThis = req.user.role === 'owner' && String(req.tenantId) === String(targetTenantId);

  if (!isSuper && !isOwnerOfThis) {
    throw new ApiError(403, 'You do not have permission to delete this workspace');
  }

  const tenant = await Tenant.findById(targetTenantId);
  if (!tenant) {
    throw new ApiError(404, 'Workspace not found');
  }

  // Prevent deleting if it's the last remaining superadmin's home tenant and they are currently logged into it without another workspace
  const totalTenants = await Tenant.countDocuments();
  if (totalTenants <= 1) {
    throw new ApiError(400, 'Cannot delete the only existing workspace in the system');
  }

  // Cascade delete all documents associated with this tenant
  await Promise.all([
    Student.deleteMany({ tenantId: targetTenantId }),
    ClassPlan.deleteMany({ tenantId: targetTenantId }),
    Subject.deleteMany({ tenantId: targetTenantId }),
    Payment.deleteMany({ tenantId: targetTenantId }),
    ReminderLog.deleteMany({ tenantId: targetTenantId }),
    User.deleteMany({ tenantId: targetTenantId }),
    Tenant.findByIdAndDelete(targetTenantId),
  ]);

  res.json({
    message: `Workspace "${tenant.name}" and all associated data have been permanently deleted`,
    deletedId: targetTenantId,
  });
});

