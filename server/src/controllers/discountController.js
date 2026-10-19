import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiError } from '../utils/ApiError.js';
import DiscountCode from '../models/DiscountCode.js';
import { recordAudit } from '../services/auditService.js';

/**
 * List all discount codes for the current tenant.
 * GET /api/discounts
 */
export const getDiscounts = asyncHandler(async (req, res) => {
  const tenantId = req.tenantId;
  const discounts = await DiscountCode.find({ tenantId }).sort({ createdAt: -1 });
  res.json(discounts);
});

/**
 * Create a new discount code.
 * POST /api/discounts
 */
export const createDiscount = asyncHandler(async (req, res) => {
  const { code, description, discountType, value, minOrderAmount, maxDiscountAmount, validTill, usageLimit } = req.body;
  const tenantId = req.tenantId;

  if (!code || value === undefined) {
    throw new ApiError(400, 'Discount code and value are required');
  }

  const existing = await DiscountCode.findOne({ tenantId, code: code.trim().toUpperCase() });
  if (existing) {
    throw new ApiError(409, 'Discount code already exists in your workspace');
  }

  const discount = await DiscountCode.create({
    tenantId,
    code: code.trim().toUpperCase(),
    description: description?.trim() || '',
    discountType: discountType || 'flat',
    value: Number(value),
    minOrderAmount: Number(minOrderAmount) || 0,
    maxDiscountAmount: Number(maxDiscountAmount) || 0,
    validTill: validTill ? new Date(validTill) : undefined,
    usageLimit: Number(usageLimit) || 0,
    isActive: true,
  });

  await recordAudit({
    tenantId,
    userId: req.user?._id,
    action: 'discount_created',
    entity: 'DiscountCode',
    entityId: discount._id,
    details: { code: discount.code, value: discount.value, discountType: discount.discountType },
    ipAddress: req.ip,
  });

  res.status(201).json(discount);
});

/**
 * Validate discount code for an amount.
 * POST /api/discounts/validate
 */
export const validateDiscount = asyncHandler(async (req, res) => {
  const { code, amount } = req.body;
  const tenantId = req.tenantId;

  if (!code) {
    throw new ApiError(400, 'Discount code is required');
  }

  const discount = await DiscountCode.findOne({
    tenantId,
    code: code.trim().toUpperCase(),
    isActive: true,
  });

  if (!discount) {
    throw new ApiError(404, 'Invalid or inactive discount code');
  }

  if (discount.validTill && new Date(discount.validTill) < new Date()) {
    throw new ApiError(400, 'Discount code has expired');
  }

  if (discount.usageLimit > 0 && discount.usageCount >= discount.usageLimit) {
    throw new ApiError(400, 'Discount code usage limit exceeded');
  }

  const billAmount = Number(amount) || 0;
  if (discount.minOrderAmount > 0 && billAmount < discount.minOrderAmount) {
    throw new ApiError(400, `Minimum bill amount of ₹${discount.minOrderAmount} required to use this code`);
  }

  let calculatedDiscount = 0;
  if (discount.discountType === 'percentage') {
    calculatedDiscount = (billAmount * discount.value) / 100;
    if (discount.maxDiscountAmount > 0 && calculatedDiscount > discount.maxDiscountAmount) {
      calculatedDiscount = discount.maxDiscountAmount;
    }
  } else {
    // Flat
    calculatedDiscount = Math.min(discount.value, billAmount);
  }

  const finalAmount = Math.max(0, billAmount - calculatedDiscount);

  res.json({
    valid: true,
    code: discount.code,
    discountType: discount.discountType,
    value: discount.value,
    discountAmount: Math.round(calculatedDiscount),
    originalAmount: billAmount,
    finalAmount: Math.round(finalAmount),
  });
});

/**
 * Toggle discount active status.
 * PATCH /api/discounts/:id/toggle
 */
export const toggleDiscount = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const tenantId = req.tenantId;

  const discount = await DiscountCode.findOne({ _id: id, tenantId });
  if (!discount) {
    throw new ApiError(404, 'Discount code not found');
  }

  discount.isActive = !discount.isActive;
  await discount.save();

  res.json(discount);
});

