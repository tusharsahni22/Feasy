import Payment from '../models/Payment.js';
import Student from '../models/Student.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiError } from '../utils/ApiError.js';
import { addMonths, planToMonths } from '../utils/subscription.js';
import { monthKey } from '../utils/dates.js';
import { logAudit } from '../services/auditService.js';

// GET /api/payments?student=&from=&to=&method=&limit=
export const listPayments = asyncHandler(async (req, res) => {
  const { student, from, to, method, limit } = req.query;
  const filter = { tenantId: req.tenantId };
  if (student) filter.student = student;
  if (method) filter.method = method;
  if (from || to) {
    filter.paidAt = {};
    if (from) filter.paidAt.$gte = new Date(from);
    if (to) filter.paidAt.$lte = new Date(to);
  }

  const payments = await Payment.find(filter)
    .populate({ path: 'student', select: 'name parentName classPlan', populate: { path: 'classPlan', select: 'name' } })
    .sort({ paidAt: -1 })
    .limit(Number(limit) || 200)
    .lean();

  res.json(payments);
});

// GET /api/students/:id/payments
export const getStudentPayments = asyncHandler(async (req, res) => {
  const payments = await Payment.find({ student: req.params.id, tenantId: req.tenantId })
    .sort({ paidAt: -1 })
    .lean();
  res.json(payments);
});

// POST /api/payments
// body: { student, amount, method, forMonth, note, paidAt, renew, renewPlan, restartDate }
export const createPayment = asyncHandler(async (req, res) => {
  const {
    student: studentId,
    amount,
    method,
    forMonth,
    note,
    paidAt,
    renew,
    renewPlan,
    restartDate,
  } = req.body;

  if (!studentId) throw new ApiError(400, 'Student is required');
  if (amount === undefined || Number(amount) < 0) {
    throw new ApiError(400, 'A valid amount is required');
  }

  const student = await Student.findOne({ _id: studentId, tenantId: req.tenantId });
  if (!student) throw new ApiError(404, 'Student not found');

  const when = paidAt ? new Date(paidAt) : new Date();

  const payment = await Payment.create({
    tenantId: req.tenantId,
    student: student._id,
    amount: Number(amount),
    method: method || 'cash',
    forMonth: forMonth || monthKey(when),
    note,
    paidAt: when,
    renewed: Boolean(renew),
  });

  // Optionally extend or restart the subscription (renewal).
  if (renew) {
    const plan = renewPlan || student.plan || 'monthly';
    const planMonths = planToMonths(plan);

    if (restartDate) {
      // User entered an explicit restart date: anchor to this new date
      const restart = new Date(restartDate);
      student.subscriptionStart = restart;
      student.subscriptionEnd = addMonths(restart, planMonths, restart.getDate());
    } else {
      // Standard renewal: extend from whichever is later — today or the current end date —
      // anchored to the student's joining day.
      const base =
        student.subscriptionEnd && new Date(student.subscriptionEnd) > new Date()
          ? new Date(student.subscriptionEnd)
          : new Date();
      const anchorDay = student.subscriptionStart
        ? new Date(student.subscriptionStart).getDate()
        : undefined;
      student.subscriptionEnd = addMonths(base, planMonths, anchorDay);
    }

    student.plan = plan;
    student.status = 'active';
    await student.save();
  }

  await logAudit({
    tenantId: req.tenantId,
    user: req.user,
    action: 'payment.create',
    entityType: 'Payment',
    entityId: payment._id,
    description: `Recorded payment of ₹${amount} (${payment.method}) for member ${student.name}${renew ? ' (Renewed)' : ''}`,
    changes: { amount: Number(amount), method: payment.method, renewed: Boolean(renew), member: student.name },
  });

  res.status(201).json(payment);
});

// DELETE /api/payments/:id
export const deletePayment = asyncHandler(async (req, res) => {
  const deleted = await Payment.findOneAndDelete({ _id: req.params.id, tenantId: req.tenantId });
  if (!deleted) throw new ApiError(404, 'Payment not found');

  await logAudit({
    tenantId: req.tenantId,
    user: req.user,
    action: 'payment.delete',
    entityType: 'Payment',
    entityId: deleted._id,
    description: `Deleted payment record of ₹${deleted.amount}`,
    changes: { amount: deleted.amount, method: deleted.method },
  });

  res.json({ message: 'Payment deleted' });
});
