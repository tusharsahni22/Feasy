import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiError } from '../utils/ApiError.js';
import Attendance from '../models/Attendance.js';
import Student from '../models/Student.js';
import { recordAudit } from '../services/auditService.js';

// Helper to get local YYYY-MM-DD
function getTodayDateString() {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Scan barcode/RFID or member ID code for check-in / check-out.
 * POST /api/attendance/scan
 */
export const scanAttendance = asyncHandler(async (req, res) => {
  const { code, method = 'barcode' } = req.body;

  if (!code || !code.trim()) {
    throw new ApiError(400, 'Barcode or Member Code is required');
  }

  const queryCode = code.trim();
  const tenantId = req.tenantId;

  // Search by barcode or mongo ID
  let student = await Student.findOne({
    tenantId,
    barcode: queryCode,
  }).populate('classPlan', 'name');

  if (!student && queryCode.match(/^[0-9a-fA-F]{24}$/)) {
    student = await Student.findOne({ _id: queryCode, tenantId }).populate('classPlan', 'name');
  }

  if (!student) {
    throw new ApiError(404, `No member found with code: ${queryCode}`);
  }

  const today = getTodayDateString();

  // Find attendance record for today
  let attendance = await Attendance.findOne({
    tenantId,
    studentId: student._id,
    date: today,
  }).sort({ createdAt: -1 });

  let action = 'checked_in';

  if (!attendance) {
    // Fresh check-in for today
    attendance = await Attendance.create({
      tenantId,
      studentId: student._id,
      date: today,
      checkIn: new Date(),
      method,
    });
    action = 'checked_in';
  } else if (!attendance.checkOut) {
    // If already checked in and no check-out, record check-out (or if checked in within 2 minutes, inform already in)
    const diffMinutes = Math.max(0, Math.round((Date.now() - new Date(attendance.checkIn).getTime()) / 60000));
    if (diffMinutes < 1) {
      return res.json({
        message: `${student.name} is already checked in just now.`,
        action: 'already_checked_in',
        student,
        attendance,
      });
    }

    attendance.checkOut = new Date();
    attendance.durationMinutes = diffMinutes;
    await attendance.save();
    action = 'checked_out';
  } else {
    // Checked out earlier, create a 2nd visit check-in for today
    attendance = await Attendance.create({
      tenantId,
      studentId: student._id,
      date: today,
      checkIn: new Date(),
      method,
    });
    action = 'checked_in';
  }

  // Audit
  await recordAudit({
    tenantId,
    userId: req.user?._id,
    action: `attendance_${action}`,
    entity: 'Attendance',
    entityId: attendance._id,
    details: { studentName: student.name, barcode: queryCode, action },
    ipAddress: req.ip,
  });

  // Calculate subscription status alert
  const isExpired = new Date(student.subscriptionEnd) < new Date();

  res.json({
    message: action === 'checked_in' ? `Welcome ${student.name}!` : `Goodbye ${student.name}!`,
    action,
    isExpired,
    student: {
      _id: student._id,
      name: student.name,
      parentPhone: student.parentPhone,
      bloodGroup: student.bloodGroup,
      shiftTiming: student.shiftTiming,
      classPlan: student.classPlan,
      subscriptionEnd: student.subscriptionEnd,
      status: student.status,
    },
    attendance,
  });
});

/**
 * List attendance records for a specific date or student.
 * GET /api/attendance
 */
export const getAttendance = asyncHandler(async (req, res) => {
  const { date = getTodayDateString(), studentId, page = 1, limit = 50 } = req.query;
  const tenantId = req.tenantId;

  const filter = { tenantId };
  if (date) filter.date = date;
  if (studentId) filter.studentId = studentId;

  const total = await Attendance.countDocuments(filter);
  const records = await Attendance.find(filter)
    .populate('studentId', 'name parentPhone barcode bloodGroup shiftTiming')
    .sort({ checkIn: -1 })
    .skip((page - 1) * limit)
    .limit(Number(limit));

  res.json({
    records,
    total,
    page: Number(page),
    date,
  });
});

/**
 * Manual check-in / check-out entry.
 * POST /api/attendance/manual
 */
export const manualAttendance = asyncHandler(async (req, res) => {
  const { studentId, date = getTodayDateString(), checkIn, checkOut, notes } = req.body;
  const tenantId = req.tenantId;

  if (!studentId) {
    throw new ApiError(400, 'Student ID is required');
  }

  let duration = 0;
  if (checkIn && checkOut) {
    duration = Math.max(0, Math.round((new Date(checkOut).getTime() - new Date(checkIn).getTime()) / 60000));
  }

  const attendance = await Attendance.create({
    tenantId,
    studentId,
    date,
    checkIn: checkIn ? new Date(checkIn) : new Date(),
    checkOut: checkOut ? new Date(checkOut) : undefined,
    durationMinutes: duration,
    status: req.body.status || 'present',
    method: 'manual',
    notes: notes || '',
  });

  res.status(201).json(attendance);
});

/**
 * Bulk mark attendance for all or selected students on a given date with specific in/out time.
 * POST /api/attendance/bulk
 */
export const bulkAttendance = asyncHandler(async (req, res) => {
  const { entries, date = getTodayDateString() } = req.body;
  // entries: [{ studentId, status: 'present'|'absent'|'late', checkIn, checkOut }]
  const tenantId = req.tenantId;

  if (!Array.isArray(entries) || entries.length === 0) {
    throw new ApiError(400, 'Expected non-empty entries array');
  }

  const results = [];
  for (const item of entries) {
    if (!item.studentId) continue;

    let inTime = item.checkIn ? new Date(item.checkIn) : new Date();
    let outTime = item.checkOut ? new Date(item.checkOut) : undefined;
    let duration = 0;
    if (inTime && outTime) {
      duration = Math.max(0, Math.round((outTime.getTime() - inTime.getTime()) / 60000));
    }

    // Upsert attendance for student for this date
    const record = await Attendance.findOneAndUpdate(
      { tenantId, studentId: item.studentId, date },
      {
        $set: {
          status: item.status || 'present',
          checkIn: item.status === 'absent' ? undefined : inTime,
          checkOut: item.status === 'absent' ? undefined : outTime,
          durationMinutes: item.status === 'absent' ? 0 : duration,
          method: 'bulk',
          notes: item.notes || '',
        },
      },
      { upsert: true, new: true }
    );
    results.push(record);
  }

  res.json({ message: `Attendance saved for ${results.length} students`, records: results });
});

/**
 * Update / Check out an existing attendance log entry.
 * PATCH /api/attendance/:id/checkout
 */
export const updateCheckOut = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { checkOut = new Date() } = req.body;
  const tenantId = req.tenantId;

  const attendance = await Attendance.findOne({ _id: id, tenantId });
  if (!attendance) {
    throw new ApiError(404, 'Attendance entry not found');
  }

  const outTime = new Date(checkOut);
  const diffMinutes = Math.max(0, Math.round((outTime.getTime() - new Date(attendance.checkIn).getTime()) / 60000));

  attendance.checkOut = outTime;
  attendance.durationMinutes = diffMinutes;
  await attendance.save();

  res.json(attendance);
});

