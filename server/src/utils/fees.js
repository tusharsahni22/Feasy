/**
 * Fee model: monthly fee = class base fee + sum of enrolled subject add-ons.
 * `subjects` is an array of subject documents (each with an `addOnFee`).
 */
export function computeFees(baseFee = 0, subjects = []) {
  const subjectsFee = subjects.reduce((sum, s) => sum + (s?.addOnFee || 0), 0);
  return {
    baseFee,
    subjectsFee,
    monthlyFee: baseFee + subjectsFee,
  };
}
