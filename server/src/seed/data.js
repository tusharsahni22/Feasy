/**
 * Seed content for Feasy Workspace. Fees are monthly, in the configured
 * currency (₹ by default). Subscription end dates are expressed as an
 * offset in days from "today" so the seeded data always contains a realistic
 * mix of active / expiring / expired subscriptions whenever you run it.
 */

export const classes = [
  { name: 'Nursery', order: 1, baseMonthlyFee: 800 },
  { name: 'LKG', order: 2, baseMonthlyFee: 900 },
  { name: 'UKG', order: 3, baseMonthlyFee: 1000 },
  { name: 'Class 1', order: 4, baseMonthlyFee: 1200 },
  { name: 'Class 2', order: 5, baseMonthlyFee: 1300 },
  { name: 'Class 3', order: 6, baseMonthlyFee: 1400 },
  { name: 'Class 4', order: 7, baseMonthlyFee: 1500 },
  { name: 'Class 5', order: 8, baseMonthlyFee: 1600 },
  { name: 'Class 6', order: 9, baseMonthlyFee: 1800 },
  { name: 'Class 7', order: 10, baseMonthlyFee: 1900 },
  { name: 'Class 8', order: 11, baseMonthlyFee: 2000 },
  { name: 'Class 9', order: 12, baseMonthlyFee: 2500 },
  { name: 'Class 10', order: 13, baseMonthlyFee: 2800 },
  { name: 'Class 11', order: 14, baseMonthlyFee: 3200 },
  { name: 'Class 12', order: 15, baseMonthlyFee: 3500 },
];

/**
 * Subjects are class-scoped: every class gets its own copy of a subject, with
 * an add-on fee that grows with the band. The same name (e.g. "Mathematics")
 * therefore exists many times over — once per class — each priced for its level.
 */
const SUBJECT_BANDS = [
  {
    classes: ['Nursery', 'LKG', 'UKG'],
    subjects: [
      { name: 'English', code: 'ENG', addOnFee: 150 },
      { name: 'Hindi', code: 'HIN', addOnFee: 150 },
      { name: 'Mathematics', code: 'MATH', addOnFee: 150 },
      { name: 'EVS', code: 'EVS', addOnFee: 120 },
      { name: 'Drawing', code: 'ART', addOnFee: 120 },
      { name: 'Rhymes', code: 'RHY', addOnFee: 100 },
    ],
  },
  {
    classes: ['Class 1', 'Class 2', 'Class 3', 'Class 4', 'Class 5'],
    subjects: [
      { name: 'English', code: 'ENG', addOnFee: 250 },
      { name: 'Hindi', code: 'HIN', addOnFee: 200 },
      { name: 'Mathematics', code: 'MATH', addOnFee: 300 },
      { name: 'EVS', code: 'EVS', addOnFee: 250 },
      { name: 'Science', code: 'SCI', addOnFee: 300 },
      { name: 'Computer', code: 'CS', addOnFee: 250 },
      { name: 'Drawing', code: 'ART', addOnFee: 150 },
    ],
  },
  {
    classes: ['Class 6', 'Class 7', 'Class 8'],
    subjects: [
      { name: 'English', code: 'ENG', addOnFee: 300 },
      { name: 'Hindi', code: 'HIN', addOnFee: 250 },
      { name: 'Mathematics', code: 'MATH', addOnFee: 400 },
      { name: 'Science', code: 'SCI', addOnFee: 400 },
      { name: 'Social Studies', code: 'SST', addOnFee: 300 },
      { name: 'Sanskrit', code: 'SAN', addOnFee: 200 },
      { name: 'Computer', code: 'CS', addOnFee: 300 },
    ],
  },
  {
    classes: ['Class 9', 'Class 10'],
    subjects: [
      { name: 'English', code: 'ENG', addOnFee: 350 },
      { name: 'Hindi', code: 'HIN', addOnFee: 300 },
      { name: 'Mathematics', code: 'MATH', addOnFee: 450 },
      { name: 'Science', code: 'SCI', addOnFee: 500 },
      { name: 'Social Studies', code: 'SST', addOnFee: 350 },
      { name: 'Computer', code: 'CS', addOnFee: 350 },
    ],
  },
  {
    classes: ['Class 11', 'Class 12'],
    subjects: [
      { name: 'English', code: 'ENG', addOnFee: 400 },
      { name: 'Physics', code: 'PHY', addOnFee: 600 },
      { name: 'Chemistry', code: 'CHEM', addOnFee: 600 },
      { name: 'Mathematics', code: 'MATH', addOnFee: 600 },
      { name: 'Biology', code: 'BIO', addOnFee: 600 },
      { name: 'Accountancy', code: 'ACC', addOnFee: 550 },
      { name: 'Business Studies', code: 'BST', addOnFee: 500 },
      { name: 'Economics', code: 'ECO', addOnFee: 500 },
      { name: 'Computer', code: 'CS', addOnFee: 400 },
    ],
  },
];

// Flattened to one entry per (class, subject), tagged with its class name.
export const subjects = SUBJECT_BANDS.flatMap((band) =>
  band.classes.flatMap((className) =>
    band.subjects.map((s) => ({ class: className, ...s }))
  )
);

export const students = [
  { name: 'Aarav Sharma', parentName: 'Rajesh Sharma', gender: 'male', phone: '9876500011', class: 'Class 5', subjects: ['Mathematics', 'Science', 'English'], plan: 'quarterly', endOffsetDays: 6 },
  { name: 'Diya Verma', parentName: 'Sunita Verma', gender: 'female', phone: '9876500012', class: 'Class 8', subjects: ['Mathematics', 'Science', 'English', 'Social Studies'], plan: 'monthly', endOffsetDays: -3 },
  { name: 'Kabir Singh', parentName: 'Harpreet Singh', gender: 'male', phone: '9876500013', class: 'Class 10', subjects: ['Mathematics', 'Science', 'English', 'Social Studies', 'Computer'], plan: 'half_yearly', endOffsetDays: 40 },
  { name: 'Ananya Gupta', parentName: 'Manoj Gupta', gender: 'female', phone: '9876500014', class: 'Class 12', subjects: ['Physics', 'Chemistry', 'Mathematics'], plan: 'annual', endOffsetDays: 150 },
  { name: 'Vivaan Patel', parentName: 'Nikhil Patel', gender: 'male', phone: '9876500015', class: 'Nursery', subjects: ['English', 'Drawing'], plan: 'monthly', endOffsetDays: 4 },
  { name: 'Ishaan Reddy', parentName: 'Srinivas Reddy', gender: 'male', phone: '9876500016', class: 'Class 3', subjects: ['Mathematics', 'English', 'EVS'], plan: 'monthly', endOffsetDays: 22 },
  { name: 'Saanvi Nair', parentName: 'Priya Nair', gender: 'female', phone: '9876500017', class: 'Class 6', subjects: ['Mathematics', 'Science', 'Sanskrit'], plan: 'quarterly', endOffsetDays: 2 },
  { name: 'Advait Joshi', parentName: 'Kiran Joshi', gender: 'male', phone: '9876500018', class: 'Class 11', subjects: ['Physics', 'Chemistry', 'Biology'], plan: 'annual', endOffsetDays: 200 },
  { name: 'Myra Khan', parentName: 'Imran Khan', gender: 'female', phone: '9876500019', class: 'LKG', subjects: ['English', 'Drawing'], plan: 'monthly', endOffsetDays: -5 },
  { name: 'Reyansh Mehta', parentName: 'Alok Mehta', gender: 'male', phone: '9876500020', class: 'Class 9', subjects: ['Mathematics', 'Science', 'Social Studies', 'Computer'], plan: 'half_yearly', endOffsetDays: 75 },
  { name: 'Aadhya Iyer', parentName: 'Lakshmi Iyer', gender: 'female', phone: '9876500021', class: 'Class 7', subjects: ['Mathematics', 'Science', 'Hindi'], plan: 'monthly', endOffsetDays: 7 },
  { name: 'Arjun Rao', parentName: 'Venkatesh Rao', gender: 'male', phone: '9876500022', class: 'Class 4', subjects: ['Mathematics', 'English', 'EVS'], plan: 'quarterly', endOffsetDays: 55 },
  { name: 'Kiara Desai', parentName: 'Rohan Desai', gender: 'female', phone: '9876500023', class: 'UKG', subjects: ['English', 'Mathematics', 'Drawing'], plan: 'monthly', endOffsetDays: -2 },
  { name: 'Vihaan Malhotra', parentName: 'Sandeep Malhotra', gender: 'male', phone: '9876500024', class: 'Class 2', subjects: ['English', 'Mathematics', 'EVS'], plan: 'monthly', endOffsetDays: 12 },
  { name: 'Anika Bose', parentName: 'Debashish Bose', gender: 'female', phone: '9876500025', class: 'Class 12', subjects: ['Accountancy', 'Business Studies', 'Economics'], plan: 'annual', endOffsetDays: 110 },
];
