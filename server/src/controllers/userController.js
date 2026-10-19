import bcrypt from 'bcryptjs';
import User from '../models/User.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiError } from '../utils/ApiError.js';
import { logAudit } from '../services/auditService.js';

// GET /api/users (List staff/team members of this workspace)
export const listTeamMembers = asyncHandler(async (req, res) => {
  const users = await User.find({ tenantId: req.tenantId })
    .select('-passwordHash')
    .sort({ createdAt: 1 })
    .lean();
  res.json(users);
});

// POST /api/users (Add/invite a staff/admin member to current workspace)
export const addTeamMember = asyncHandler(async (req, res) => {
  // Only owners or workspace admins can add team members
  if (req.user.role !== 'owner' && req.user.role !== 'admin' && !req.user.isSuperAdmin) {
    throw new ApiError(403, 'Only owners and admins can add team members');
  }

  const { name, email, password, role, phone } = req.body;

  if (!name || !name.trim()) throw new ApiError(400, 'Full name is required');
  if (!email || !email.trim()) throw new ApiError(400, 'Email address is required');
  if (!password || password.length < 6) throw new ApiError(400, 'Password must be at least 6 characters');

  const normalizedEmail = email.toLowerCase().trim();
  const existing = await User.findOne({ email: normalizedEmail });
  if (existing) {
    throw new ApiError(409, 'An account with this email already exists');
  }

  const assignedRole = role && ['admin', 'accountant', 'staff', 'readonly'].includes(role)
    ? role
    : 'staff';

  const salt = await bcrypt.genSalt(10);
  const passwordHash = await bcrypt.hash(password, salt);

  const newUser = await User.create({
    tenantId: req.tenantId,
    name: name.trim(),
    email: normalizedEmail,
    passwordHash,
    phone: phone ? phone.trim() : '',
    role: assignedRole,
    status: 'active',
  });

  await logAudit({
    tenantId: req.tenantId,
    user: req.user,
    action: 'user.create',
    entityType: 'User',
    entityId: newUser._id,
    description: `Added new team member ${newUser.name} (${newUser.email}) with role: ${assignedRole}`,
    changes: { role: assignedRole, email: newUser.email },
  });

  res.status(201).json({
    id: newUser._id,
    _id: newUser._id,
    name: newUser.name,
    email: newUser.email,
    phone: newUser.phone,
    role: newUser.role,
    status: newUser.status,
    createdAt: newUser.createdAt,
  });
});

// PUT /api/users/:id (Update role or status of a team member)
export const updateTeamMember = asyncHandler(async (req, res) => {
  if (req.user.role !== 'owner' && req.user.role !== 'admin' && !req.user.isSuperAdmin) {
    throw new ApiError(403, 'Permission denied');
  }

  const target = await User.findOne({ _id: req.params.id, tenantId: req.tenantId });
  if (!target) throw new ApiError(404, 'User not found in this workspace');

  // Do not allow non-owners to modify the owner's role
  if (target.role === 'owner' && req.user.role !== 'owner' && !req.user.isSuperAdmin) {
    throw new ApiError(403, 'Cannot modify workspace owner');
  }

  const { role, status, name, phone, password } = req.body;
  const before = { role: target.role, status: target.status, name: target.name };

  if (role && ['admin', 'accountant', 'staff', 'readonly'].includes(role)) {
    if (target.role !== 'owner') target.role = role;
  }
  if (status && ['active', 'inactive'].includes(status)) {
    if (target.role !== 'owner') target.status = status;
  }
  if (name) target.name = name.trim();
  if (phone !== undefined) target.phone = phone.trim();

  if (password && password.length >= 6) {
    const salt = await bcrypt.genSalt(10);
    target.passwordHash = await bcrypt.hash(password, salt);
  }

  await target.save();

  await logAudit({
    tenantId: req.tenantId,
    user: req.user,
    action: 'user.update',
    entityType: 'User',
    entityId: target._id,
    description: `Updated team member profile for ${target.name}`,
    changes: { before, after: { role: target.role, status: target.status, name: target.name } },
  });

  res.json({
    id: target._id,
    _id: target._id,
    name: target.name,
    email: target.email,
    phone: target.phone,
    role: target.role,
    status: target.status,
    updatedAt: target.updatedAt,
  });
});

// DELETE /api/users/:id (Remove team member from workspace)
export const deleteTeamMember = asyncHandler(async (req, res) => {
  if (req.user.role !== 'owner' && !req.user.isSuperAdmin) {
    throw new ApiError(403, 'Only workspace owner can remove team members');
  }

  const target = await User.findOne({ _id: req.params.id, tenantId: req.tenantId });
  if (!target) throw new ApiError(404, 'User not found');
  if (target.role === 'owner') throw new ApiError(400, 'Cannot delete workspace owner');

  await User.findByIdAndDelete(target._id);

  await logAudit({
    tenantId: req.tenantId,
    user: req.user,
    action: 'user.delete',
    entityType: 'User',
    entityId: target._id,
    description: `Removed team member ${target.name} (${target.email})`,
  });

  res.json({ message: 'User removed from workspace' });
});

