import mongoose from 'mongoose';
import { env } from '../config/env.js';
import Tenant from '../models/Tenant.js';
import Student from '../models/Student.js';
import ClassPlan from '../models/ClassPlan.js';
import Subject from '../models/Subject.js';
import Payment from '../models/Payment.js';
import ReminderLog from '../models/ReminderLog.js';

async function run() {
  await mongoose.connect(env.mongoUri);
  const mainTenant = await Tenant.findOne({ slug: 'feasy-main' });
  const ironTenant = await Tenant.findOne({ slug: 'team-iron-champ' });

  if (mainTenant) {
    const s = await Student.updateMany({ tenantId: { $exists: false } }, { $set: { tenantId: mainTenant._id } });
    const c = await ClassPlan.updateMany({ tenantId: { $exists: false } }, { $set: { tenantId: mainTenant._id } });
    const sub = await Subject.updateMany({ tenantId: { $exists: false } }, { $set: { tenantId: mainTenant._id } });
    const p = await Payment.updateMany({ tenantId: { $exists: false } }, { $set: { tenantId: mainTenant._id } });
    const r = await ReminderLog.updateMany({ tenantId: { $exists: false } }, { $set: { tenantId: mainTenant._id } });
    console.log('Backfilled legacy records to Feasy main:', {
      students: s.modifiedCount,
      classes: c.modifiedCount,
      subjects: sub.modifiedCount,
      payments: p.modifiedCount,
      reminders: r.modifiedCount
    });
  }

  // Ensure ironTenant has default tiers if it has none
  if (ironTenant) {
    const count = await ClassPlan.countDocuments({ tenantId: ironTenant._id });
    if (count === 0) {
      const tiers = await ClassPlan.insertMany([
        { tenantId: ironTenant._id, name: 'Standard Gym Pass', order: 1, baseMonthlyFee: 1500 },
        { tenantId: ironTenant._id, name: 'Strength & Cardio Tier', order: 2, baseMonthlyFee: 2200 },
        { tenantId: ironTenant._id, name: 'VIP All-Access Pass', order: 3, baseMonthlyFee: 3500 },
      ]);
      await Subject.insertMany([
        { tenantId: ironTenant._id, classPlan: tiers[0]._id, name: 'Personal Trainer 1-on-1', code: 'PT-101', addOnFee: 2000, active: true },
        { tenantId: ironTenant._id, classPlan: tiers[0]._id, name: 'Steam / Sauna Access', code: 'SPA', addOnFee: 500, active: true },
      ]);
      console.log('Seeded starter plans for Team Iron Champ');
    }
  }

  const allTenants = await Tenant.find();
  for (const t of allTenants) {
    const sCount = await Student.countDocuments({ tenantId: t._id });
    const cCount = await ClassPlan.countDocuments({ tenantId: t._id });
    console.log(`[Workspace Check] Tenant: ${t.name} (${t.slug}) -> Students: ${sCount}, Classes/Tiers: ${cCount}`);
  }

  await mongoose.disconnect();
}

run().catch((e) => {
  console.error(e);
  process.exit(1);
});
