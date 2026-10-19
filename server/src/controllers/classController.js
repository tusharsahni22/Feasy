import ClassPlan from '../models/ClassPlan.js';
import Student from '../models/Student.js';
import Subject from '../models/Subject.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiError } from '../utils/ApiError.js';

// GET /api/classes
export const listClasses = asyncHandler(async (req, res) => {
  const classes = await ClassPlan.find({ tenantId: req.tenantId }).sort({ order: 1 }).lean();
  res.json(classes);
});

// POST /api/classes
export const createClass = asyncHandler(async (req, res) => {
  const { name, order, baseMonthlyFee } = req.body;
  if (!name) throw new ApiError(400, 'Name is required');
  const created = await ClassPlan.create({
    tenantId: req.tenantId,
    name,
    order: order ?? 999,
    baseMonthlyFee: baseMonthlyFee ?? 0,
  });
  res.status(201).json(created);
});

// PUT /api/classes/:id
export const updateClass = asyncHandler(async (req, res) => {
  const updated = await ClassPlan.findOneAndUpdate(
    { _id: req.params.id, tenantId: req.tenantId },
    {
      ...(req.body.name !== undefined && { name: req.body.name }),
      ...(req.body.order !== undefined && { order: req.body.order }),
      ...(req.body.baseMonthlyFee !== undefined && {
        baseMonthlyFee: req.body.baseMonthlyFee,
      }),
    },
    { new: true, runValidators: true }
  );
  if (!updated) throw new ApiError(404, 'Tier/Category not found');
  res.json(updated);
});

// DELETE /api/classes/:id
export const deleteClass = asyncHandler(async (req, res) => {
  const inUse = await Student.countDocuments({ classPlan: req.params.id, tenantId: req.tenantId });
  if (inUse > 0) {
    throw new ApiError(
      409,
      `Cannot delete: ${inUse} member(s) are assigned to this category`
    );
  }
  const deleted = await ClassPlan.findOneAndDelete({ _id: req.params.id, tenantId: req.tenantId });
  if (!deleted) throw new ApiError(404, 'Category not found');
  await Subject.deleteMany({ classPlan: req.params.id, tenantId: req.tenantId });
  res.json({ message: 'Category and its add-ons deleted' });
});
