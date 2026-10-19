import Subject from '../models/Subject.js';
import ClassPlan from '../models/ClassPlan.js';
import Student from '../models/Student.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiError } from '../utils/ApiError.js';

/** Sort by class order (Nursery → Class 12), then subject name. */
function byClassThenName(a, b) {
  const ao = a.classPlan?.order ?? 999;
  const bo = b.classPlan?.order ?? 999;
  if (ao !== bo) return ao - bo;
  return String(a.name).localeCompare(String(b.name));
}

// GET /api/subjects  (optional ?classPlan=<id>&active=true)
export const listSubjects = asyncHandler(async (req, res) => {
  const filter = {};
  if (req.query.classPlan) filter.classPlan = req.query.classPlan;
  if (req.query.active !== undefined) filter.active = req.query.active === 'true';

  const subjects = await Subject.find(filter)
    .populate('classPlan', 'name order')
    .lean();
  subjects.sort(byClassThenName);
  res.json(subjects);
});

// POST /api/subjects
export const createSubject = asyncHandler(async (req, res) => {
  const { name, code, addOnFee, classPlan, active } = req.body;
  if (!name || !name.trim()) throw new ApiError(400, 'Subject name is required');
  if (!classPlan) throw new ApiError(400, 'Please choose the class this subject belongs to');

  const cls = await ClassPlan.findById(classPlan);
  if (!cls) throw new ApiError(400, 'A valid class is required');

  const exists = await Subject.findOne({ classPlan, name: name.trim() });
  if (exists) throw new ApiError(409, `“${name.trim()}” already exists for ${cls.name}`);

  const created = await Subject.create({
    name: name.trim(),
    code,
    classPlan,
    addOnFee: addOnFee ?? 0,
    active: active ?? true,
  });

  const populated = await Subject.findById(created._id)
    .populate('classPlan', 'name order')
    .lean();
  res.status(201).json(populated);
});

// PUT /api/subjects/:id
export const updateSubject = asyncHandler(async (req, res) => {
  if (req.body.classPlan) {
    const cls = await ClassPlan.findById(req.body.classPlan);
    if (!cls) throw new ApiError(400, 'A valid class is required');
  }

  const patch = {
    ...(req.body.name !== undefined && { name: req.body.name }),
    ...(req.body.code !== undefined && { code: req.body.code }),
    ...(req.body.classPlan !== undefined && { classPlan: req.body.classPlan }),
    ...(req.body.addOnFee !== undefined && { addOnFee: req.body.addOnFee }),
    ...(req.body.active !== undefined && { active: req.body.active }),
  };

  const updated = await Subject.findByIdAndUpdate(req.params.id, patch, {
    new: true,
    runValidators: true,
  })
    .populate('classPlan', 'name order')
    .lean();
  if (!updated) throw new ApiError(404, 'Subject not found');
  res.json(updated);
});

// DELETE /api/subjects/:id
export const deleteSubject = asyncHandler(async (req, res) => {
  const inUse = await Student.countDocuments({ subjects: req.params.id });
  if (inUse > 0) {
    throw new ApiError(
      409,
      `Cannot delete: ${inUse} student(s) are enrolled in this subject`
    );
  }
  const deleted = await Subject.findByIdAndDelete(req.params.id);
  if (!deleted) throw new ApiError(404, 'Subject not found');
  res.json({ message: 'Subject deleted' });
});
