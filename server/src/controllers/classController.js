import ClassPlan from '../models/ClassPlan.js';
import Student from '../models/Student.js';
import Subject from '../models/Subject.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiError } from '../utils/ApiError.js';

// GET /api/classes
export const listClasses = asyncHandler(async (req, res) => {
  const classes = await ClassPlan.find().sort({ order: 1 }).lean();
  res.json(classes);
});

// POST /api/classes
export const createClass = asyncHandler(async (req, res) => {
  const { name, order, baseMonthlyFee } = req.body;
  if (!name) throw new ApiError(400, 'Class name is required');
  const created = await ClassPlan.create({
    name,
    order: order ?? 999,
    baseMonthlyFee: baseMonthlyFee ?? 0,
  });
  res.status(201).json(created);
});

// PUT /api/classes/:id
export const updateClass = asyncHandler(async (req, res) => {
  const updated = await ClassPlan.findByIdAndUpdate(
    req.params.id,
    {
      ...(req.body.name !== undefined && { name: req.body.name }),
      ...(req.body.order !== undefined && { order: req.body.order }),
      ...(req.body.baseMonthlyFee !== undefined && {
        baseMonthlyFee: req.body.baseMonthlyFee,
      }),
    },
    { new: true, runValidators: true }
  );
  if (!updated) throw new ApiError(404, 'Class not found');
  res.json(updated);
});

// DELETE /api/classes/:id
export const deleteClass = asyncHandler(async (req, res) => {
  const inUse = await Student.countDocuments({ classPlan: req.params.id });
  if (inUse > 0) {
    throw new ApiError(
      409,
      `Cannot delete: ${inUse} student(s) are enrolled in this class`
    );
  }
  const deleted = await ClassPlan.findByIdAndDelete(req.params.id);
  if (!deleted) throw new ApiError(404, 'Class not found');
  // Class removed and no students depend on it — clean up its (config-only)
  // subjects so they aren't left pointing at a class that no longer exists.
  await Subject.deleteMany({ classPlan: req.params.id });
  res.json({ message: 'Class and its subjects deleted' });
});
