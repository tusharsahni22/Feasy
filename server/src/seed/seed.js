import { connectDB, disconnectDB } from '../config/db.js';
import ClassPlan from '../models/ClassPlan.js';
import Subject from '../models/Subject.js';
import Student from '../models/Student.js';
import Payment from '../models/Payment.js';
import ReminderLog from '../models/ReminderLog.js';
import Settings from '../models/Settings.js';
import { classes, subjects, students as studentSeeds } from './data.js';
import { computeFees } from '../utils/fees.js';
import { addMonths, planToMonths, remainingDays } from '../utils/subscription.js';
import { monthKey } from '../utils/dates.js';
import { env } from '../config/env.js';

function daysFromNow(n) {
  const d = new Date();
  d.setHours(12, 0, 0, 0);
  d.setDate(d.getDate() + n);
  return d;
}

async function run() {
  await connectDB();

  console.log('Clearing existing collections…');
  await Promise.all([
    ClassPlan.deleteMany({}),
    Subject.deleteMany({}),
    Student.deleteMany({}),
    Payment.deleteMany({}),
    ReminderLog.deleteMany({}),
    Settings.deleteMany({}),
  ]);

  // Subjects are now class-scoped ({ classPlan, name } unique). Older databases
  // may still carry the previous global unique index on `name`, which would
  // reject the same subject name appearing under several classes. Reconcile the
  // indexes with the current schema (drops the stale one) before inserting.
  await Subject.syncIndexes();

  const classDocs = await ClassPlan.insertMany(classes);
  const classByName = new Map(classDocs.map((c) => [c.name, c]));

  // Attach each seed subject to its class, then insert.
  const subjectDocs = await Subject.insertMany(
    subjects.map((s) => ({
      name: s.name,
      code: s.code,
      addOnFee: s.addOnFee,
      classPlan: classByName.get(s.class)._id,
      active: true,
    }))
  );

  // Look subjects up by "ClassName::SubjectName" so each student resolves the
  // subject priced for their own class.
  const subjectByClassAndName = new Map();
  subjectDocs.forEach((doc) => {
    const cls = classDocs.find((c) => String(c._id) === String(doc.classPlan));
    if (cls) subjectByClassAndName.set(`${cls.name}::${doc.name}`, doc);
  });

  await Settings.create({ key: 'app', instituteName: env.instituteName });

  const now = new Date();
  const createdStudents = [];

  for (const s of studentSeeds) {
    const cls = classByName.get(s.class);
    const subs = s.subjects
      .map((n) => subjectByClassAndName.get(`${s.class}::${n}`))
      .filter(Boolean);
    const fees = computeFees(cls.baseMonthlyFee, subs);
    const end = daysFromNow(s.endOffsetDays);
    const start = addMonths(end, -planToMonths(s.plan));

    // eslint-disable-next-line no-await-in-loop
    const student = await Student.create({
      name: s.name,
      parentName: s.parentName,
      parentPhone: s.phone,
      gender: s.gender,
      classPlan: cls._id,
      subjects: subs.map((x) => x._id),
      baseFee: fees.baseFee,
      subjectsFee: fees.subjectsFee,
      monthlyFee: fees.monthlyFee,
      plan: s.plan,
      subscriptionStart: start,
      subscriptionEnd: end,
      status: 'active',
    });
    createdStudents.push(student);
  }

  // Payments: full history for the previous 5 months, plus ~2/3 of students
  // paid for the current month (so there's a realistic pending balance).
  const methods = ['cash', 'upi', 'bank', 'card'];
  const payments = [];
  createdStudents.forEach((st, idx) => {
    for (let i = 5; i >= 1; i -= 1) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 10, 12, 0, 0);
      payments.push({
        student: st._id,
        amount: st.monthlyFee,
        method: methods[(idx + i) % methods.length],
        forMonth: monthKey(d),
        paidAt: d,
        note: 'Monthly fee',
      });
    }
    if (idx % 3 !== 0) {
      const d = new Date(now.getFullYear(), now.getMonth(), Math.min(now.getDate(), 10), 12, 0, 0);
      payments.push({
        student: st._id,
        amount: st.monthlyFee,
        method: methods[idx % methods.length],
        forMonth: monthKey(d),
        paidAt: d,
        note: 'Monthly fee',
      });
    }
  });
  await Payment.insertMany(payments);

  // Seed a couple of sample (simulated) reminders for soon-to-expire students.
  const soon = createdStudents
    .filter((st) => remainingDays(st.subscriptionEnd) <= 7)
    .slice(0, 2);
  for (const st of soon) {
    // eslint-disable-next-line no-await-in-loop
    await ReminderLog.create({
      student: st._id,
      channel: 'whatsapp',
      to: st.parentPhone,
      message: `Sample fee reminder previously sent to ${st.parentName}.`,
      status: 'simulated',
      daysRemaining: remainingDays(st.subscriptionEnd),
    });
  }

  console.log(
    `✔ Seeded ${classDocs.length} classes, ${subjectDocs.length} subjects, ` +
      `${createdStudents.length} students, ${payments.length} payments.`
  );

  await disconnectDB();
  process.exit(0);
}

run().catch((err) => {
  console.error('✖ Seed failed:', err);
  process.exit(1);
});
