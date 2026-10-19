/**
 * Business Niche Presets for Feasy SaaS.
 * Controls terminology, labels, placeholders, and default reminder templates across the platform.
 */
export const BUSINESS_TYPES = [
  {
    id: 'education',
    name: 'Education / Coaching / Tuition',
    icon: 'GraduationCap',
    labels: {
      businessType: 'Education / Coaching',
      orgNameLabel: 'Institute / Academy name',
      memberSingular: 'Student',
      memberPlural: 'Students',
      contactPersonLabel: 'Parent / Guardian',
      categorySingular: 'Class',
      categoryPlural: 'Classes',
      itemSingular: 'Subject',
      itemPlural: 'Subjects',
      subscriptionLabel: 'Subscription',
      feeLabel: 'Tuition fee',
      enrollAction: 'Enroll student',
      memberDirectory: 'Students',
      plansPageTitle: 'Classes & Subjects',
      plansPageSubtitle: 'Class base fees and subject add-ons',
    },
    defaultTemplate:
      'Hello {contactPerson}, this is a reminder from {organization}. ' +
      "{memberName}'s fee subscription ({category}) has {days} day(s) left " +
      'and renews on {endDate}. Monthly amount: {currency}{fee}. ' +
      'Kindly pay to ensure uninterrupted learning. Thank you.',
  },
  {
    id: 'gym',
    name: 'Fitness Centre / Gym / Yoga Studio',
    icon: 'Dumbbell',
    labels: {
      businessType: 'Fitness / Gym',
      orgNameLabel: 'Gym / Fitness centre name',
      memberSingular: 'Member',
      memberPlural: 'Members',
      contactPersonLabel: 'Emergency contact / Sponsor',
      categorySingular: 'Membership Tier',
      categoryPlural: 'Membership Tiers',
      itemSingular: 'Add-on / Personal Training',
      itemPlural: 'Add-ons / Training',
      subscriptionLabel: 'Membership',
      feeLabel: 'Membership fee',
      enrollAction: 'Register member',
      memberDirectory: 'Members',
      plansPageTitle: 'Tiers & Add-ons',
      plansPageSubtitle: 'Base tier fees and facility / training add-ons',
    },
    defaultTemplate:
      'Hello {memberName}, reminder from {organization}: ' +
      'your gym membership ({category}) has {days} day(s) left ' +
      'and expires on {endDate}. Amount: {currency}{fee}. ' +
      'Renew today to keep working towards your fitness goals! Thank you.',
  },
  {
    id: 'library',
    name: 'Library / Study Room / Co-working Space',
    icon: 'BookOpen',
    labels: {
      businessType: 'Library / Co-working',
      orgNameLabel: 'Library / Hub name',
      memberSingular: 'Member / Patron',
      memberPlural: 'Members',
      contactPersonLabel: 'Contact person / Sponsor',
      categorySingular: 'Seat / Space Type',
      categoryPlural: 'Space Types',
      itemSingular: 'Facility / Locker / Resource',
      itemPlural: 'Facilities & Add-ons',
      subscriptionLabel: 'Access Pass',
      feeLabel: 'Seat / Space fee',
      enrollAction: 'Issue pass / Register',
      memberDirectory: 'Members',
      plansPageTitle: 'Space Types & Add-ons',
      plansPageSubtitle: 'Base seat access fees and locker / resource add-ons',
    },
    defaultTemplate:
      'Hello {memberName}, your library access pass at {organization} ({category}) ' +
      'has {days} day(s) remaining until {endDate}. Renewal fee: {currency}{fee}. ' +
      'Please renew to retain your reserved seat. Thank you.',
  },
  {
    id: 'general',
    name: 'General Subscriptions / Services / SaaS',
    icon: 'Layers',
    labels: {
      businessType: 'Subscription Business',
      orgNameLabel: 'Organization / Business name',
      memberSingular: 'Client',
      memberPlural: 'Clients',
      contactPersonLabel: 'Primary contact / Billing person',
      categorySingular: 'Plan Tier',
      categoryPlural: 'Plan Tiers',
      itemSingular: 'Feature / Add-on',
      itemPlural: 'Features & Add-ons',
      subscriptionLabel: 'Subscription',
      feeLabel: 'Recurring fee',
      enrollAction: 'Add client',
      memberDirectory: 'Clients',
      plansPageTitle: 'Plans & Add-ons',
      plansPageSubtitle: 'Base plan fees and add-on services',
    },
    defaultTemplate:
      'Hello {contactPerson}, this is a reminder from {organization}. ' +
      "{memberName}'s subscription ({category}) has {days} day(s) left " +
      'and renews on {endDate}. Total fee: {currency}{fee}. ' +
      'Kindly complete payment to continue service. Thank you.',
  },
];

export const DEFAULT_BUSINESS_TYPE = 'education';

export function getPreset(businessType = DEFAULT_BUSINESS_TYPE) {
  return (
    BUSINESS_TYPES.find((b) => b.id === businessType) ||
    BUSINESS_TYPES.find((b) => b.id === DEFAULT_BUSINESS_TYPE)
  );
}
