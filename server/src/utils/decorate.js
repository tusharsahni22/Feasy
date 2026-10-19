import { remainingDays, subscriptionStatus } from './subscription.js';

/**
 * Attach computed subscription fields to a plain student object.
 * Works on lean() results or `.toObject()` output.
 */
export function decorateStudent(obj, leadDays = 7) {
  if (!obj) return obj;
  const isCustomStatus = obj.status === 'paused' || obj.status === 'inactive';
  return {
    ...obj,
    remainingDays: remainingDays(obj.subscriptionEnd),
    subscriptionStatus: isCustomStatus
      ? obj.status
      : subscriptionStatus(obj.subscriptionEnd, leadDays),
  };
}
