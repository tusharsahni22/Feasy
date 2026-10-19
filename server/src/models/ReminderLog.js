import mongoose from 'mongoose';

/** An audit record of every reminder we attempted to send to a parent. */
const reminderLogSchema = new mongoose.Schema(
  {
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Student',
      required: true,
      index: true,
    },
    channel: { type: String, enum: ['whatsapp', 'sms'], required: true },
    to: { type: String, required: true },
    message: { type: String, required: true },
    // sent = delivered to provider, failed = provider error,
    // simulated = no credentials configured (logged only).
    status: { type: String, enum: ['sent', 'failed', 'simulated'], required: true },
    providerMessageId: { type: String },
    error: { type: String },
    daysRemaining: { type: Number },
    sentAt: { type: Date, default: () => new Date(), index: true },
  },
  { timestamps: true }
);

export default mongoose.model('ReminderLog', reminderLogSchema);
