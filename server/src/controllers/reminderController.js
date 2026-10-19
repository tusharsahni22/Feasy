import Student from '../models/Student.js';
import ReminderLog from '../models/ReminderLog.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiError } from '../utils/ApiError.js';
import { dispatchMessage, renderTemplate, CHANNELS } from '../services/messaging/index.js';
import { getSettings } from '../services/settingsService.js';
import { remainingDays } from '../utils/subscription.js';
import { currencySymbol } from '../utils/currency.js';

function formatDate(d) {
  if (!d) return '';
  return new Date(d).toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

// POST /api/reminders/send
// body: { studentIds: string[], channel: 'whatsapp'|'sms', template?: string }
export const sendReminders = asyncHandler(async (req, res) => {
  const { studentIds, channel, template } = req.body;

  if (!Array.isArray(studentIds) || studentIds.length === 0) {
    throw new ApiError(400, 'Select at least one student to remind');
  }
  if (!CHANNELS.includes(channel)) {
    throw new ApiError(400, `channel must be one of: ${CHANNELS.join(', ')}`);
  }

  const settings = await getSettings();
  const tmpl = template || settings.reminderTemplate;
  const symbol = currencySymbol(settings.currency);

  const students = await Student.find({ _id: { $in: studentIds } })
    .populate('classPlan')
    .lean();

  const results = [];
  for (const s of students) {
    const days = remainingDays(s.subscriptionEnd);
    const message = renderTemplate(tmpl, {
      parentName: s.parentName,
      studentName: s.name,
      class: s.classPlan?.name || '',
      days,
      endDate: formatDate(s.subscriptionEnd),
      fee: s.monthlyFee,
      currency: symbol,
      institute: settings.instituteName,
    });

    let outcome;
    try {
      outcome = await dispatchMessage(channel, { to: s.parentPhone, message });
    } catch (err) {
      outcome = { status: 'failed', to: s.parentPhone, error: err.message };
    }

    const log = await ReminderLog.create({
      student: s._id,
      channel,
      to: outcome.to || s.parentPhone,
      message,
      status: outcome.status,
      providerMessageId: outcome.providerMessageId,
      error: outcome.error,
      daysRemaining: days,
    });

    results.push({
      studentId: s._id,
      name: s.name,
      to: outcome.to || s.parentPhone,
      status: outcome.status,
      error: outcome.error,
      info: outcome.info,
      message,
      logId: log._id,
    });
  }

  const summary = results.reduce((acc, r) => {
    acc[r.status] = (acc[r.status] || 0) + 1;
    return acc;
  }, {});

  res.json({ channel, summary, results });
});

// GET /api/reminders?limit=
export const listReminders = asyncHandler(async (req, res) => {
  const logs = await ReminderLog.find()
    .populate({
      path: 'student',
      select: 'name parentName classPlan',
      populate: { path: 'classPlan', select: 'name' },
    })
    .sort({ sentAt: -1 })
    .limit(Number(req.query.limit) || 100)
    .lean();
  res.json(logs);
});
