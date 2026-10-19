import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import Tenant from '../models/Tenant.js';
import User from '../models/User.js';
import Settings from '../models/Settings.js';
import ClassPlan from '../models/ClassPlan.js';
import Subject from '../models/Subject.js';
import { env } from '../config/env.js';
import { ApiError } from '../utils/ApiError.js';
import { asyncHandler } from '../utils/asyncHandler.js';

function signToken(user) {
  return jwt.sign(
    { userId: user._id, tenantId: user.tenantId, role: user.role, isSuperAdmin: user.isSuperAdmin },
    env.jwtSecret,
    { expiresIn: '30d' }
  );
}

// POST /api/auth/register
// Restricted: Only existing workspace owners or superadmins can create new workspaces/tenants.
export const register = asyncHandler(async (req, res) => {
  const { orgName, slug, name, email, password, phone, businessType } = req.body;

  if (!orgName || !name || !email || !password) {
    throw new ApiError(400, 'Organization name, user name, email, and password are required');
  }

  // Check if self-registration is locked down:
  // If at least one user exists, only an authenticated SuperAdmin or Owner can create workspaces
  const userCount = await User.countDocuments();
  if (userCount > 0) {
    if (!req.user || (!req.user.isSuperAdmin && req.user.role !== 'owner')) {
      throw new ApiError(403, 'Public registration is disabled. Only platform administrators can provision new workspaces.');
    }
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
    isSuperAdmin: userCount === 0, // First ever user becomes superadmin
  });

  // Automatically seed default starter tiers / plans & add-ons for the new workspace
  try {
    const bType = tenant.businessType || 'gym';
    let defaultTiers = [];
    let defaultAddons = [];

    if (bType === 'gym') {
      defaultTiers = [
        { name: 'Standard Gym Pass', order: 1, baseMonthlyFee: 1500 },
        { name: 'Strength & Cardio Tier', order: 2, baseMonthlyFee: 2200 },
        { name: 'VIP All-Access Pass', order: 3, baseMonthlyFee: 3500 },
      ];
      defaultAddons = [
        { name: 'Personal Trainer 1-on-1', code: 'PT-101', addOnFee: 2000 },
        { name: 'Steam / Sauna Access', code: 'SPA', addOnFee: 500 },
        { name: 'Dedicated Locker', code: 'LCK', addOnFee: 300 },
      ];
    } else if (bType === 'library') {
      defaultTiers = [
        { name: 'Standard Reading Hall', order: 1, baseMonthlyFee: 800 },
        { name: 'Reserved Cabin Desk', order: 2, baseMonthlyFee: 1500 },
        { name: '24/7 Night Owl Seat', order: 3, baseMonthlyFee: 2000 },
      ];
      defaultAddons = [
        { name: 'Personal Locker', code: 'LCK', addOnFee: 250 },
        { name: 'High-Speed Wi-Fi Boost', code: 'WIFI', addOnFee: 200 },
      ];
    } else if (bType === 'general') {
      defaultTiers = [
        { name: 'Basic Tier', order: 1, baseMonthlyFee: 1000 },
        { name: 'Pro Tier', order: 2, baseMonthlyFee: 2500 },
        { name: 'Enterprise Tier', order: 3, baseMonthlyFee: 5000 },
      ];
      defaultAddons = [
        { name: 'Priority Support', code: 'SUP', addOnFee: 500 },
        { name: 'Extra Storage / Add-on', code: 'STR', addOnFee: 300 },
      ];
    } else {
      // education
      defaultTiers = [
        { name: 'Class 8', order: 8, baseMonthlyFee: 1000 },
        { name: 'Class 9', order: 9, baseMonthlyFee: 1200 },
        { name: 'Class 10', order: 10, baseMonthlyFee: 1500 },
      ];
      defaultAddons = [
        { name: 'Mathematics', code: 'MATH', addOnFee: 300 },
        { name: 'Science', code: 'SCI', addOnFee: 300 },
      ];
    }

    const createdTiers = await ClassPlan.insertMany(
      defaultTiers.map((t) => ({ ...t, tenantId: tenant._id }))
    );

    if (createdTiers.length > 0 && defaultAddons.length > 0) {
      const primaryTier = createdTiers[0]._id;
      await Subject.insertMany(
        defaultAddons.map((s) => ({
          ...s,
          tenantId: tenant._id,
          classPlan: primaryTier,
          active: true,
        }))
      );
    }
  } catch (seedErr) {
    console.warn('Failed to seed default starter plans for tenant:', seedErr.message);
  }

  const token = signToken(user);

  res.status(201).json({
    token,
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      isSuperAdmin: Boolean(user.isSuperAdmin),
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
      isSuperAdmin: Boolean(user.isSuperAdmin),
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
      isSuperAdmin: Boolean(req.user.isSuperAdmin),
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

