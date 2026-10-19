import mongoose from 'mongoose';

/**
 * Attendance record for a student/member.
 * Supports barcode/QR scans as well as manual check-in / check-out.
 */
const attendanceSchema = new mongoose.Schema(
  {
    tenantId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Tenant',
      required: true,
      index: true,
    },
    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Student',
      required: true,
      index: true,
    },
    date: {
      type: String, // 'YYYY-MM-DD' for fast daily aggregation
      required: true,
      index: true,
    },
    checkIn: {
      type: Date,
      default: Date.now,
    },
    checkOut: {
      type: Date,
    },
    method: {
      type: String,
      enum: ['barcode', 'qr', 'manual'],
      default: 'barcode',
    },
    notes: {
      type: String,
      trim: true,
      default: '',
    },
  },
  { timestamps: true }
);

// One entry per student per day or multiple visits
attendanceSchema.index({ tenantId: 1, date: 1 });
attendanceSchema.index({ tenantId: 1, studentId: 1, date: 1 });

export default mongoose.model('Attendance', attendanceSchema);

