import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import Tenant from '../models/Tenant.js';
import User from '../models/User.js';
import Settings from '../models/Settings.js';
import { env } from '../config/env.js';
import { ApiError } from '../utils/ApiError.js';
import { asyncHandler } from '../utils/asyncHandler.js';

function signToken(user) {
  return jwt.sign(
    { userId: user._id, tenantId: user.tenantId, role: user.role },
    env.jwtSecret,
    { expiresIn: '30d' }
  );
}

// POST /api/auth/register
export const register = asyncHandler(async (req, res) => {
  const { orgName, slug, name, email, password, phone, businessType } = req.body;

  if (!orgName || !name || !email || !password) {
    throw new ApiError(400, 'Organization name, user name, email, and password are required');
  }

  const existingUser = await User.findOne({ email: email.toLowerCase().trim() });
  if (existingUser) {
    throw new ApiError(409, 'An account with this email already exists');
  }

  // Derive slug or sanitize provided slug
  const finalSlug = (slug || orgName)
    .toLowerCase()
    .replace(/[^a-z0-9-]/g, '-')
    .replace(/-+/g, '-')
    .slice(0, 32);

  const existingTenant = await Tenant.findOne({ slug: finalSlug });
  if (existingTenant) {
    throw new ApiError(409, `Workspace identifier "${finalSlug}" is already taken`);
  }

  const tenant = await Tenant.create({
    name: orgName.trim(),
    slug: finalSlug,
    businessType: businessType || env.businessType || 'gym',
  });

  const salt = await bcrypt.genSalt(10);
  const passwordHash = await bcrypt.hash(password, salt);

  const user = await User.create({
    name: name.trim(),
    email: email.toLowerCase().trim(),
    passwordHash,
    phone: phone ? phone.trim() : '',
    tenantId: tenant._id,
    role: 'owner',
  });

  const token = signToken(user);

  res.status(201).json({
    token,
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
    },
    tenant: {
      id: tenant._id,
      name: tenant.name,
      slug: tenant.slug,
      businessType: tenant.businessType,
      branding: tenant.branding,
    },
  });
});

// POST /api/auth/login
export const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    throw new ApiError(400, 'Email and password are required');
  }

  const user = await User.findOne({ email: email.toLowerCase().trim() }).populate('tenantId');
  if (!user) {
    throw new ApiError(401, 'Invalid email or password');
  }

  const match = await user.comparePassword(password);
  if (!match) {
    throw new ApiError(401, 'Invalid email or password');
  }

  if (user.status !== 'active') {
    throw new ApiError(403, 'Your account is deactivated');
  }

  if (!user.tenantId || user.tenantId.status !== 'active') {
    throw new ApiError(403, 'Your workspace is inactive or suspended');
  }

  const token = signToken(user);

  res.json({
    token,
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
    },
    tenant: {
      id: user.tenantId._id,
      name: user.tenantId.name,
      slug: user.tenantId.slug,
      businessType: user.tenantId.businessType,
      branding: user.tenantId.branding,
    },
  });
});

// GET /api/auth/me
export const getMe = asyncHandler(async (req, res) => {
  res.json({
    user: {
      id: req.user._id,
      name: req.user.name,
      email: req.user.email,
      role: req.user.role,
      phone: req.user.phone,
    },
    tenant: {
      id: req.tenant._id,
      name: req.tenant.name,
      slug: req.tenant.slug,
      businessType: req.tenant.businessType,
      currency: req.tenant.currency,
      customLabels: req.tenant.customLabels || {},
      branding: req.tenant.branding,
    },
  });
});
