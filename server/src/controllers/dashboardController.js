import mongoose from 'mongoose';
import Student from '../models/Student.js';
import Payment from '../models/Payment.js';
import ClassPlan from '../models/ClassPlan.js';
import Attendance from '../models/Attendance.js';
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

async function sumPayments(tenantId, match) {
  const query = { ...match };
  if (tenantId) {
    query.tenantId = new mongoose.Types.ObjectId(String(tenantId));
  }
  const [agg] = await Payment.aggregate([
    { $match: query },
    { $group: { _id: null, total: { $sum: '$amount' }, count: { $sum: 1 } } },
  ]);
  return { total: agg?.total || 0, count: agg?.count || 0 };
}

// GET /api/dashboard/summary
export const getSummary = asyncHandler(async (req, res) => {
  const tenantId = req.tenantId;
  const settings = await getSettings(tenantId);
  const leadDays = settings.reminderLeadDays;
  const now = new Date();

  const students = await Student.find({ tenantId }).lean();
  const active = students.filter((s) => s.status === 'active');

  const expectedMonthly = active.reduce((sum, s) => sum + (s.monthlyFee || 0), 0);
  const expectedAnnual = expectedMonthly * 12;

  const month = await sumPayments(tenantId, {
    paidAt: { $gte: startOfMonth(now), $lte: endOfMonth(now) },
  });
  const year = await sumPayments(tenantId, {
    paidAt: { $gte: startOfYear(now), $lte: endOfYear(now) },
  });
  const allTime = await sumPayments(tenantId, {});

  // Per-student dues for the current month
  const matchDues = {
    paidAt: { $gte: startOfMonth(now), $lte: endOfMonth(now) },
  };
  if (tenantId) {
    matchDues.tenantId = new mongoose.Types.ObjectId(String(tenantId));
  }

  const paidThisMonth = await Payment.aggregate([
    { $match: matchDues },
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

  // Attendance Analytics (Daily, Weekly, Monthly)
  const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
  
  // 7 days ago string
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const sevenDaysAgoStr = `${sevenDaysAgo.getFullYear()}-${String(sevenDaysAgo.getMonth() + 1).padStart(2, '0')}-${String(sevenDaysAgo.getDate()).padStart(2, '0')}`;

  // Start of this month string
  const monthStartStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`;

  const [dailyAtt, weeklyAtt, monthlyAtt, insideNow] = await Promise.all([
    Attendance.countDocuments({ tenantId, date: todayStr }),
    Attendance.countDocuments({ tenantId, date: { $gte: sevenDaysAgoStr, $lte: todayStr } }),
    Attendance.countDocuments({ tenantId, date: { $gte: monthStartStr, $lte: todayStr } }),
    Attendance.countDocuments({ tenantId, date: todayStr, checkOut: { $exists: false } }),
  ]);

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
    attendance: {
      daily: dailyAtt,
      weekly: weeklyAtt,
      monthly: monthlyAtt,
      insideNow,
    },
  });
});

// GET /api/dashboard/charts
export const getCharts = asyncHandler(async (req, res) => {
  const tenantId = req.tenantId;
  const settings = await getSettings(tenantId);
  const leadDays = settings.reminderLeadDays;
  const now = new Date();

  // Monthly collection trend (last 6 months)
  const months = lastMonths(6, now);
  const monthlyCollection = await Promise.all(
    months.map(async (m) => {
      const { total } = await sumPayments(tenantId, { paidAt: { $gte: m.start, $lte: m.end } });
      return { label: m.label, month: m.key, total };
    })
  );

  // Students per class
  const classMatch = tenantId ? { tenantId: new mongoose.Types.ObjectId(String(tenantId)) } : {};
  const [byClass, classes, students] = await Promise.all([
    Student.aggregate([
      { $match: classMatch },
      { $group: { _id: '$classPlan', count: { $sum: 1 } } },
    ]),
    ClassPlan.find({ tenantId }).sort({ order: 1 }).lean(),
    Student.find({ tenantId }).select('subscriptionEnd status monthlyFee').lean(),
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

  // Attendance Trend (Last 7 Days)
  const last7Days = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
    const dateStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    const dayLabel = d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
    last7Days.push({ date: dateStr, label: dayLabel });
  }

  const attendanceTrend = await Promise.all(
    last7Days.map(async (day) => {
      const count = await Attendance.countDocuments({ tenantId, date: day.date });
      return { date: day.date, day: day.label, count };
    })
  );

  res.json({
    monthlyCollection,
    studentsByClass,
    subscriptionBreakdown: [
      { name: 'Active', value: breakdown.active, key: 'active' },
      { name: 'Expiring', value: breakdown.expiring, key: 'expiring' },
      { name: 'Expired', value: breakdown.expired, key: 'expired' },
    ],
    attendanceTrend,
  });
});

// GET /api/dashboard/expiring?within=&limit=
export const getExpiring = asyncHandler(async (req, res) => {
  const tenantId = req.tenantId;
  const settings = await getSettings(tenantId);
  const leadDays = settings.reminderLeadDays;
  const within = req.query.within !== undefined ? Number(req.query.within) : null;
  const limit = Number(req.query.limit) || 100;

  const students = await Student.find({ tenantId, status: 'active' })
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
