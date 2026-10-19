import { connectDB } from '../config/db.js';
import Tenant from '../models/Tenant.js';
import User from '../models/User.js';
import Student from '../models/Student.js';
import ClassPlan from '../models/ClassPlan.js';
import Subject from '../models/Subject.js';
import Payment from '../models/Payment.js';
import ReminderLog from '../models/ReminderLog.js';
import bcrypt from 'bcryptjs';

async function setup() {
  await connectDB();

  let tenant = await Tenant.findOne({ slug: 'feasy-main' });
  if (!tenant) {
    tenant = await Tenant.create({
      name: 'Feasy Fitness & Sports',
      slug: 'feasy-main',
      businessType: 'gym',
    });
    console.log('✔ Created default tenant:', tenant._id);
  } else {
    console.log('✔ Found default tenant:', tenant._id);
  }

  let admin = await User.findOne({ email: 'admin@feasy.io' });
  if (!admin) {
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash('admin123', salt);
    admin = await User.create({
      name: 'Workspace Owner',
      email: 'admin@feasy.io',
      passwordHash,
      tenantId: tenant._id,
      role: 'owner',
    });
    console.log('✔ Created default admin user: admin@feasy.io / password: admin123');
  } else {
    console.log('✔ Default admin user ready: admin@feasy.io');
  }

  const sRes = await Student.updateMany({ tenantId: { $exists: false } }, { tenantId: tenant._id });
  const cRes = await ClassPlan.updateMany({ tenantId: { $exists: false } }, { tenantId: tenant._id });
  const subRes = await Subject.updateMany({ tenantId: { $exists: false } }, { tenantId: tenant._id });
  const pRes = await Payment.updateMany({ tenantId: { $exists: false } }, { tenantId: tenant._id });
  const rRes = await ReminderLog.updateMany({ tenantId: { $exists: false } }, { tenantId: tenant._id });

  console.log('✔ Backfilled existing collections with tenantId:', {
    members: sRes.modifiedCount,
    classes: cRes.modifiedCount,
    payments: pRes.modifiedCount,
  });

  process.exit(0);
}

setup().catch((e) => {
  console.error(e);
  process.exit(1);
});
