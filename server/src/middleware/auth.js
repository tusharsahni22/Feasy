import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';
import User from '../models/User.js';
import Tenant from '../models/Tenant.js';
import { ApiError } from '../utils/ApiError.js';
import { asyncHandler } from '../utils/asyncHandler.js';

/**
 * Protect routes: verify JWT bearer token, load user & tenant into req.
 */
export const requireAuth = asyncHandler(async (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    throw new ApiError(401, 'Authentication token required');
  }

  const token = authHeader.split(' ')[1];
  let decoded;
  try {
    decoded = jwt.verify(token, env.jwtSecret);
  } catch (err) {
    throw new ApiError(401, 'Invalid or expired authentication token');
  }

  const user = await User.findById(decoded.userId).populate('tenantId');
  if (!user || user.status !== 'active') {
    throw new ApiError(401, 'User account not found or deactivated');
  }

  if (!user.tenantId || user.tenantId.status !== 'active') {
    throw new ApiError(403, 'Workspace suspended or inactive');
  }

  req.user = user;
  req.tenant = user.tenantId;
  req.tenantId = user.tenantId._id;
  next();
});

/**
 * Optional Auth: Parses token if present, does not fail if absent.
 */
export const optionalAuth = asyncHandler(async (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return next();
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, env.jwtSecret);
    const user = await User.findById(decoded.userId).populate('tenantId');
    if (user && user.status === 'active') {
      req.user = user;
      req.tenant = user.tenantId;
      req.tenantId = user.tenantId?._id;
    }
  } catch {
    // Ignore invalid tokens for optional auth
  }
  next();
});

/**
 * Enforce Role-Based Access Control (RBAC).
 * Example: requireRoles(['owner', 'admin'])
 */
export const requireRoles = (roles = []) => {
  return (req, res, next) => {
    if (!req.user) {
      throw new ApiError(401, 'Authentication required');
    }
    if (!roles.includes(req.user.role)) {
      throw new ApiError(403, `Access denied: requires ${roles.join(' or ')} role`);
    }
    next();
  };
};

/**
 * Enforce platform superadmin / owner access.
 */
export const requireSuperAdmin = (req, res, next) => {
  if (!req.user) {
    throw new ApiError(401, 'Authentication required');
  }
  if (!req.user.isSuperAdmin) {
    throw new ApiError(403, 'Platform Super Admin access required');
  }
  next();
};

