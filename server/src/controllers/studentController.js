import Student from '../models/Student.js';
import ClassPlan from '../models/ClassPlan.js';
import Subject from '../models/Subject.js';
import Payment from '../models/Payment.js';
import ReminderLog from '../models/ReminderLog.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiError } from '../utils/ApiError.js';
import { computeFees } from '../utils/fees.js';
import { computeEndDate } from '../utils/subscription.js';
import { decorateStudent } from '../utils/decorate.js';
import { getSettings } from '../services/settingsService.js';

/** Resolve class + subjects, then compute the fee snapshot and subscription window. */
async function buildFeeAndSubscription(body, existing = null) {
  const classId = body.classPlan ?? existing?.classPlan;
  const cls = await ClassPlan.findById(classId);
  if (!cls) throw new ApiError(400, 'A valid class is required');

  const subjectIds = body.subjects ?? existing?.subjects?.map(String) ?? [];
  const subjects = subjectIds.length
    ? await Subject.find({ _id: { $in: subjectIds } })
    : [];
  if (subjectIds.length && subjects.length !== subjectIds.length) {
    throw new ApiError(400, 'One or more selected subjects are invalid');
  }

  const fees = computeFees(cls.baseMonthlyFee, subjects);
  const plan = body.plan ?? existing?.plan ?? 'monthly';
  const start = body.subscriptionStart
    ? new Date(body.subscriptionStart)
    : existing?.subscriptionStart ?? new Date();

  let end;
  if (body.subscriptionEnd) end = new Date(body.subscriptionEnd);
  else if (body.plan || body.subscriptionStart || !existing) end = computeEndDate(start, plan);
  else end = existing.subscriptionEnd;

  return { fees, plan, start, end, subjectIds };
}

// GET /api/students
export const listStudents = asyncHandler(async (req, res) => {
  const { q, classPlan, status, sort } = req.query;
  const { reminderLeadDays } = await getSettings();

  const filter = {};
  if (classPlan) filter.classPlan = classPlan;
  if (status) filter.status = status;
  if (q) {
    const rx = new RegExp(q.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
    filter.$or = [{ name: rx }, { parentName: rx }, { parentPhone: rx }];
  }

  const students = await Student.find(filter)
    .populate('classPlan')
    .populate('subjects')
    .lean();

  let decorated = students.map((s) => decorateStudent(s, reminderLeadDays));

  if (sort === 'remaining') {
    decorated.sort((a, b) => (a.remainingDays ?? 1e9) - (b.remainingDays ?? 1e9));
  } else if (sort === 'name') {
    decorated.sort((a, b) => a.name.localeCompare(b.name));
  } else {
    decorated.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  }

  res.json(decorated);
});

// GET /api/students/:id
export const getStudent = asyncHandler(async (req, res) => {
  const { reminderLeadDays } = await getSettings();
  const student = await Student.findById(req.params.id)
    .populate('classPlan')
    .populate('subjects')
    .lean();
  if (!student) throw new ApiError(404, 'Student not found');
  res.json(decorateStudent(student, reminderLeadDays));
});

// POST /api/students
export const createStudent = asyncHandler(async (req, res) => {
  const { name, parentName, parentPhone } = req.body;
  if (!name || !parentName || !parentPhone) {
    throw new ApiError(400, 'Name, parent name and parent phone are required');
  }

  const { fees, plan, start, end, subjectIds } = await buildFeeAndSubscription(req.body);

  const created = await Student.create({
    name,
    parentName,
    parentPhone,
    gender: req.body.gender,
    classPlan: req.body.classPlan,
    subjects: subjectIds,
    baseFee: fees.baseFee,
    subjectsFee: fees.subjectsFee,
    monthlyFee: fees.monthlyFee,
    plan,
    subscriptionStart: start,
    subscriptionEnd: end,
    status: req.body.status || 'active',
    notes: req.body.notes,
  });

  const populated = await Student.findById(created._id)
    .populate('classPlan')
    .populate('subjects')
    .lean();
  const { reminderLeadDays } = await getSettings();
  res.status(201).json(decorateStudent(populated, reminderLeadDays));
});

// PUT /api/students/:id
export const updateStudent = asyncHandler(async (req, res) => {
  const existing = await Student.findById(req.params.id);
  if (!existing) throw new ApiError(404, 'Student not found');

  const { fees, plan, start, end, subjectIds } = await buildFeeAndSubscription(
    req.body,
    existing
  );

  const fields = {
    ...(req.body.name !== undefined && { name: req.body.name }),
    ...(req.body.parentName !== undefined && { parentName: req.body.parentName }),
    ...(req.body.parentPhone !== undefined && { parentPhone: req.body.parentPhone }),
    ...(req.body.gender !== undefined && { gender: req.body.gender }),
    ...(req.body.classPlan !== undefined && { classPlan: req.body.classPlan }),
    ...(req.body.notes !== undefined && { notes: req.body.notes }),
    ...(req.body.status !== undefined && { status: req.body.status }),
    subjects: subjectIds,
    baseFee: fees.baseFee,
    subjectsFee: fees.subjectsFee,
    monthlyFee: fees.monthlyFee,
    plan,
    subscriptionStart: start,
    subscriptionEnd: end,
  };

  const updated = await Student.findByIdAndUpdate(req.params.id, fields, {
    new: true,
    runValidators: true,
  })
    .populate('classPlan')
    .populate('subjects')
    .lean();

  const { reminderLeadDays } = await getSettings();
  res.json(decorateStudent(updated, reminderLeadDays));
});

// DELETE /api/students/:id  — cascades payments + reminder logs
export const deleteStudent = asyncHandler(async (req, res) => {
  const student = await Student.findById(req.params.id);
  if (!student) throw new ApiError(404, 'Student not found');
  await Promise.all([
    Payment.deleteMany({ student: student._id }),
    ReminderLog.deleteMany({ student: student._id }),
    student.deleteOne(),
  ]);
  res.json({ message: 'Student and related records deleted' });
});
