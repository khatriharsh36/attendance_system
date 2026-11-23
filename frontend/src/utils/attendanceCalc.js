/**
 * Client-side Attendance Forecasting & Simulation Utility
 */

export const calculateAttendanceStats = ({ attended = 0, conducted = 0, targetPercentage = 75 }) => {
  const att = Math.max(0, Number(attended) || 0);
  const total = Math.max(0, Number(conducted) || 0);
  const target = Math.min(100, Math.max(1, Number(targetPercentage) || 75));
  const r = target / 100;

  if (total === 0) {
    return {
      percentage: null,
      formattedPercentage: 'N/A',
      status: 'No Sessions',
      classesNeeded: 0,
      canMiss: 0,
      isShortage: false,
    };
  }

  const percentage = Number(((att / total) * 100).toFixed(2));

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
    classesNeeded = att === total ? 0 : Infinity;
    canMiss = 0;
  } else {
    if (percentage < target) {
      const numerator = r * total - att;
      const denominator = 1 - r;
      classesNeeded = Math.max(0, Math.ceil(numerator / denominator));
      canMiss = 0;
    } else {
      classesNeeded = 0;
      canMiss = Math.max(0, Math.floor(att / r - total));
    }
  }

  return {
    percentage,
    formattedPercentage: `${percentage.toFixed(1)}%`,
    status,
    classesNeeded: Number.isFinite(classesNeeded) ? classesNeeded : -1,
    canMiss,
    isShortage,
  };
};

export const simulateFutureSessions = ({ attended, conducted, futureAttend, futureMiss }) => {
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
    formattedPercentage: `${projectedPercentage.toFixed(1)}%`,
  };
};
