import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiError } from '../utils/ApiError.js';
import Student from '../models/Student.js';
import { dispatchMessage } from '../services/messaging/index.js';
import { getSettingsForTenant } from '../services/settingsService.js';
import { recordAudit } from '../services/auditService.js';

/**
 * Update diet plan for an individual student.
 * PUT /api/diet/student/:id
 */
export const updateStudentDiet = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { title, caloriesTarget, details, pdfUrl } = req.body;
  const tenantId = req.tenantId;

  const student = await Student.findOne({ _id: id, tenantId });
  if (!student) {
    throw new ApiError(404, 'Student/Member not found');
  }

  student.dietPlan = {
    title: title || 'Personalized Diet & Nutrition Plan',
    caloriesTarget: Number(caloriesTarget) || 0,
    details: details || '',
    pdfUrl: pdfUrl || '',
    updatedAt: new Date(),
  };

  await student.save();

  await recordAudit({
    tenantId,
    userId: req.user?._id,
    action: 'diet_plan_updated',
    entity: 'Student',
    entityId: student._id,
    details: { studentName: student.name, dietTitle: student.dietPlan.title },
    ipAddress: req.ip,
  });

  res.json({ message: 'Diet plan updated successfully', student });
});

/**
 * Bulk upload diet plans. Accepts an array of { studentId or phone or barcode, title, caloriesTarget, details, pdfUrl }
 * POST /api/diet/bulk-upload
 */
export const bulkUploadDiet = asyncHandler(async (req, res) => {
  const { plans } = req.body; // array of items
  const tenantId = req.tenantId;

  if (!Array.isArray(plans) || plans.length === 0) {
    throw new ApiError(400, 'Expected non-empty "plans" array');
  }

  const results = {
    total: plans.length,
    updated: 0,
    failed: 0,
    errors: [],
  };

  for (const item of plans) {
    try {
      const query = { tenantId };
      if (item.studentId) {
        query._id = item.studentId;
      } else if (item.barcode) {
        query.barcode = String(item.barcode).trim();
      } else if (item.phone) {
        const rawPhone = String(item.phone).trim();
        const cleanDigits = rawPhone.replace(/\D/g, '');
        const phoneVariants = [
          rawPhone,
          cleanDigits,
          rawPhone.startsWith('+91') ? rawPhone.slice(3) : null,
          cleanDigits.length === 10 ? '+91' + cleanDigits : null,
        ].filter(Boolean);
        query.parentPhone = { $in: phoneVariants };
      } else if (item.name) {
        query.name = new RegExp(`^${item.name.trim()}$`, 'i');
      } else {
        throw new Error('No identifier provided (need studentId, barcode, phone, or name)');
      }

      const student = await Student.findOne(query);
      if (!student) {
        throw new Error(`Member not found for ${item.studentId || item.barcode || item.phone || item.name}`);
      }

      student.dietPlan = {
        title: item.title || 'Personalized Diet Plan',
        caloriesTarget: Number(item.caloriesTarget) || 0,
        details: item.details || '',
        pdfUrl: item.pdfUrl || '',
        updatedAt: new Date(),
      };

      await student.save();
      results.updated++;
    } catch (err) {
      results.failed++;
      results.errors.push({ item, error: err.message });
    }
  }

  await recordAudit({
    tenantId,
    userId: req.user?._id,
    action: 'diet_plan_bulk_upload',
    entity: 'Student',
    details: { updated: results.updated, failed: results.failed },
    ipAddress: req.ip,
  });

  res.json(results);
});

/**
 * Send diet plan to student via WhatsApp or SMS.
 * POST /api/diet/send/:id
 */
export const sendDietPlan = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { channel = 'whatsapp' } = req.body;
  const tenantId = req.tenantId;

  const student = await Student.findOne({ _id: id, tenantId });
  if (!student) {
    throw new ApiError(404, 'Student/Member not found');
  }

  if (!student.dietPlan || (!student.dietPlan.details && !student.dietPlan.pdfUrl)) {
    throw new ApiError(400, 'Student does not have a diet plan assigned yet');
  }

  const settings = await getSettingsForTenant(tenantId);
  const instituteName = settings?.instituteName || 'Fitness Center';

  let messageText = `Hi ${student.name},\n\nHere is your *${student.dietPlan.title || 'Diet & Nutrition Plan'}* from ${instituteName}:\n\n`;

  if (student.dietPlan.caloriesTarget > 0) {
    messageText += `🎯 Target Daily Calories: ${student.dietPlan.caloriesTarget} kcal\n\n`;
  }

  if (student.dietPlan.details) {
    messageText += `📋 *Plan Details:*\n${student.dietPlan.details}\n\n`;
  }

  if (student.dietPlan.pdfUrl) {
    messageText += `📎 Download Full PDF: ${student.dietPlan.pdfUrl}\n\n`;
  }

  messageText += `Stay healthy and consistent!\n- ${instituteName}`;

  try {
    const dispatchResult = await dispatchMessage(channel, {
      to: student.parentPhone,
      text: messageText,
      mediaUrl: student.dietPlan.pdfUrl || undefined,
    });

    await recordAudit({
      tenantId,
      userId: req.user?._id,
      action: 'diet_plan_dispatched',
      entity: 'Student',
      entityId: student._id,
      details: { channel, studentName: student.name, to: student.parentPhone },
      ipAddress: req.ip,
    });

    res.json({
      success: true,
      message: `Diet plan sent via ${channel} to ${student.parentPhone}`,
      dispatchResult,
    });
  } catch (err) {
    throw new ApiError(500, `Failed to send diet plan: ${err.message}`);
  }
});

/**
 * Send diet plan to all members who have an active diet plan.
 * POST /api/diet/bulk-send
 */
export const bulkSendDiet = asyncHandler(async (req, res) => {
  const { channel = 'whatsapp', studentIds } = req.body;
  const tenantId = req.tenantId;

  const filter = { tenantId, 'dietPlan.details': { $exists: true, $ne: '' } };
  if (Array.isArray(studentIds) && studentIds.length > 0) {
    filter._id = { $in: studentIds };
  }

  const students = await Student.find(filter);
  const settings = await getSettingsForTenant(tenantId);
  const instituteName = settings?.instituteName || 'Fitness Center';

  const results = {
    total: students.length,
    sent: 0,
    failed: 0,
  };

  for (const s of students) {
    try {
      let messageText = `Hi ${s.name},\n\nHere is your *${s.dietPlan.title || 'Diet & Nutrition Plan'}* from ${instituteName}:\n\n`;
      if (s.dietPlan.caloriesTarget > 0) messageText += `🎯 Target: ${s.dietPlan.caloriesTarget} kcal\n\n`;
      if (s.dietPlan.details) messageText += `📋 *Plan:*\n${s.dietPlan.details}\n\n`;
      if (s.dietPlan.pdfUrl) messageText += `📎 PDF: ${s.dietPlan.pdfUrl}\n\n`;
      messageText += `Stay healthy!\n- ${instituteName}`;

      await dispatchMessage(channel, {
        to: s.parentPhone,
        text: messageText,
        mediaUrl: s.dietPlan.pdfUrl || undefined,
      });

      results.sent++;
    } catch {
      results.failed++;
    }
  }

  res.json(results);
});

