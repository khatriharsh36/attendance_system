/**
 * MITAOE Attendance Forecasting & Recovery Calculator
 * Implements standard academic attendance formulas:
 * 
 * Required sessions to reach target 'r':
 *   x = max(0, ceil((r * total - attended) / (1 - r)))
 * 
 * Max sessions that can be missed while staying at or above target 'r':
 *   y = max(0, floor(attended / r - total))
 */

export const calculateAttendance = ({ attended = 0, conducted = 0, targetPercentage = 75 }) => {
  const att = Math.max(0, Number(attended) || 0);
  const total = Math.max(0, Number(conducted) || 0);
  const target = Math.min(100, Math.max(1, Number(targetPercentage) || 75));
  const r = target / 100;

  if (total === 0) {
    return {
      percentage: null, // unavailable/zero sessions
      formattedPercentage: 'N/A',
      status: 'No Sessions',
      attended: 0,
      conducted: 0,
      targetPercentage: target,
      classesNeeded: 0,
      canMiss: 0,
      isShortage: false,
    };
  }

  const percentage = Number(((att / total) * 100).toFixed(2));

  // Determine status according to target threshold
  let status = 'Good';
  if (percentage < target) {
    status = 'Below Required';
  } else if (percentage < target + 5) {
    status = 'Borderline';
  }

  const isShortage = percentage < target;

  let classesNeeded = 0;
  let canMiss = 0;

  if (target >= 100) {
    // If target is 100%, can only be achieved if attended === total.
    // If attended < total, reaching 100% is impossible mathematically unless zero misses happened.
    classesNeeded = att === total ? 0 : Infinity;
    canMiss = att === total ? 0 : 0;
  } else {
    if (percentage < target) {
      // Need more classes
      const numerator = r * total - att;
      const denominator = 1 - r;
      classesNeeded = Math.max(0, Math.ceil(numerator / denominator));
      canMiss = 0;
    } else {
      // Already at or above target; how many can be missed?
      classesNeeded = 0;
      canMiss = Math.max(0, Math.floor(att / r - total));
    }
  }

  return {
    percentage,
    formattedPercentage: `${percentage}%`,
    status,
    attended: att,
    conducted: total,
    targetPercentage: target,
    classesNeeded: Number.isFinite(classesNeeded) ? classesNeeded : -1, // -1 means mathematically impossible
    canMiss,
    isShortage,
  };
};

export const projectFutureAttendance = ({
  attended = 0,
  conducted = 0,
  futureAttend = 0,
  futureMiss = 0,
}) => {
  const currentAtt = Math.max(0, Number(attended) || 0);
  const currentTotal = Math.max(0, Number(conducted) || 0);
  const willAttend = Math.max(0, Number(futureAttend) || 0);
  const willMiss = Math.max(0, Number(futureMiss) || 0);

  const newAtt = currentAtt + willAttend;
  const newTotal = currentTotal + willAttend + willMiss;

  if (newTotal === 0) {
    return {
      newAttended: 0,
      newConducted: 0,
      projectedPercentage: null,
      formattedPercentage: 'N/A',
    };
  }

  const projectedPercentage = Number(((newAtt / newTotal) * 100).toFixed(2));
  return {
    newAttended: newAtt,
    newConducted: newTotal,
    projectedPercentage,
    formattedPercentage: `${projectedPercentage}%`,
  };
};
