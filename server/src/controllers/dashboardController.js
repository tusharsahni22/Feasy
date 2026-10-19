import Student from '../models/Student.js';
import Payment from '../models/Payment.js';
import ClassPlan from '../models/ClassPlan.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { decorateStudent } from '../utils/decorate.js';
import { subscriptionStatus } from '../utils/subscription.js';
import {
  startOfMonth,
  endOfMonth,
  startOfYear,
  endOfYear,
  lastMonths,
} from '../utils/dates.js';
import { getSettings } from '../services/settingsService.js';

async function sumPayments(match) {
  const [agg] = await Payment.aggregate([
    { $match: match },
    { $group: { _id: null, total: { $sum: '$amount' }, count: { $sum: 1 } } },
  ]);
  return { total: agg?.total || 0, count: agg?.count || 0 };
}

// GET /api/dashboard/summary
export const getSummary = asyncHandler(async (req, res) => {
  const settings = await getSettings();
  const leadDays = settings.reminderLeadDays;
  const now = new Date();

  const students = await Student.find().lean();
  const active = students.filter((s) => s.status === 'active');

  const expectedMonthly = active.reduce((sum, s) => sum + (s.monthlyFee || 0), 0);
  const expectedAnnual = expectedMonthly * 12;

  const month = await sumPayments({
    paidAt: { $gte: startOfMonth(now), $lte: endOfMonth(now) },
  });
  const year = await sumPayments({
    paidAt: { $gte: startOfYear(now), $lte: endOfYear(now) },
  });
  const allTime = await sumPayments({});

  // Per-student dues for the current month
  const paidThisMonth = await Payment.aggregate([
    { $match: { paidAt: { $gte: startOfMonth(now), $lte: endOfMonth(now) } } },
    { $group: { _id: '$student', paid: { $sum: '$amount' } } },
  ]);
  const paidMap = new Map(paidThisMonth.map((p) => [String(p._id), p.paid]));

  let pendingThisMonth = 0;
  let studentsPaid = 0;
  let studentsDue = 0;
  for (const s of active) {
    const paid = paidMap.get(String(s._id)) || 0;
    const due = Math.max(0, (s.monthlyFee || 0) - paid);
    pendingThisMonth += due;
    if (due === 0) studentsPaid += 1;
    else studentsDue += 1;
  }

  // Subscription buckets
  let subActive = 0;
  let subExpiring = 0;
  let subExpired = 0;
  for (const s of students) {
    const status = subscriptionStatus(s.subscriptionEnd, leadDays);
    if (status === 'expired') subExpired += 1;
    else if (status === 'expiring') subExpiring += 1;
    else subActive += 1;
  }

  res.json({
    institute: settings.instituteName,
    currency: settings.currency,
    leadDays,
    students: {
      total: students.length,
      active: active.length,
      inactive: students.length - active.length,
    },
    money: {
      expectedMonthly,
      collectedThisMonth: month.total,
      pendingThisMonth,
      expectedAnnual,
      collectedThisYear: year.total,
      pendingYearly: Math.max(0, expectedAnnual - year.total),
      collectedAllTime: allTime.total,
      paymentsThisMonth: month.count,
    },
    collection: {
      studentsPaid,
      studentsDue,
    },
    subscriptions: {
      active: subActive,
      expiring: subExpiring,
      expired: subExpired,
    },
  });
});

// GET /api/dashboard/charts
export const getCharts = asyncHandler(async (req, res) => {
  const settings = await getSettings();
  const leadDays = settings.reminderLeadDays;
  const now = new Date();

  // Monthly collection trend (last 6 months) — one query per month keeps this
  // correct with respect to local-time month boundaries.
  const months = lastMonths(6, now);
  const monthlyCollection = await Promise.all(
    months.map(async (m) => {
      const { total } = await sumPayments({ paidAt: { $gte: m.start, $lte: m.end } });
      return { label: m.label, month: m.key, total };
    })
  );

  // Students per class
  const [byClass, classes, students] = await Promise.all([
    Student.aggregate([{ $group: { _id: '$classPlan', count: { $sum: 1 } } }]),
    ClassPlan.find().sort({ order: 1 }).lean(),
    Student.find().select('subscriptionEnd status monthlyFee').lean(),
  ]);
  const countMap = new Map(byClass.map((b) => [String(b._id), b.count]));
  const studentsByClass = classes
    .map((c) => ({ name: c.name, count: countMap.get(String(c._id)) || 0 }))
    .filter((c) => c.count > 0);

  // Subscription breakdown
  const breakdown = { active: 0, expiring: 0, expired: 0 };
  for (const s of students) {
    const status = subscriptionStatus(s.subscriptionEnd, leadDays);
    breakdown[status === 'unknown' ? 'active' : status] += 1;
  }

  res.json({
    monthlyCollection,
    studentsByClass,
    subscriptionBreakdown: [
      { name: 'Active', value: breakdown.active, key: 'active' },
      { name: 'Expiring', value: breakdown.expiring, key: 'expiring' },
      { name: 'Expired', value: breakdown.expired, key: 'expired' },
    ],
  });
});

// GET /api/dashboard/expiring?within=&limit=
export const getExpiring = asyncHandler(async (req, res) => {
  const settings = await getSettings();
  const leadDays = settings.reminderLeadDays;
  const within = req.query.within !== undefined ? Number(req.query.within) : null;
  const limit = Number(req.query.limit) || 100;

  const students = await Student.find({ status: 'active' })
    .populate('classPlan')
    .populate('subjects')
    .lean();

  let decorated = students
    .map((s) => decorateStudent(s, leadDays))
    .filter((s) => s.remainingDays !== null)
    .sort((a, b) => a.remainingDays - b.remainingDays);

  if (within !== null) {
    decorated = decorated.filter((s) => s.remainingDays <= within);
  }

  res.json(decorated.slice(0, limit));
});
