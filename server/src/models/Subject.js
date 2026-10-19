import mongoose from 'mongoose';

/**
 * A subject offered for a specific class, with its own monthly add-on fee.
 * Subjects are class-scoped: the same subject name (e.g. "Mathematics") can
 * exist for several classes, each with a different fee. A student's monthly
 * fee is their class base fee + the add-on of every subject they take.
 */
const subjectSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    code: { type: String, trim: true, uppercase: true },
    // The class this subject belongs to. Kept flexible (not strictly required
    // at the schema level) so subjects created before class-scoping still load;
    // the API requires it on create so all new subjects are class-scoped.
    classPlan: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'ClassPlan',
      index: true,
    },
    addOnFee: { type: Number, required: true, min: 0, default: 0 },
    active: { type: Boolean, default: true },
  },
  { timestamps: true }
);

// A class can't have two subjects with the same name, but different classes
// can share names (that's the whole point of class-wise subjects).
subjectSchema.index({ classPlan: 1, name: 1 }, { unique: true });

export default mongoose.model('Subject', subjectSchema);
