import { describe, it, expect } from 'vitest';
import { calculateAttendance, projectFutureAttendance } from '../utils/calculator.js';

describe('MITAOE Attendance Forecasting Calculator Tests', () => {
  it('should handle zero sessions properly (unavailable state)', () => {
    const res = calculateAttendance({ attended: 0, conducted: 0, targetPercentage: 75 });
    expect(res.percentage).toBeNull();
    expect(res.formattedPercentage).toBe('N/A');
    expect(res.status).toBe('No Sessions');
    expect(res.isShortage).toBe(false);
  });

  it('should calculate exact 75% attendance correctly as Good', () => {
    // 15 attended out of 20 = 75.0%
    const res = calculateAttendance({ attended: 15, conducted: 20, targetPercentage: 75 });
    expect(res.percentage).toBe(75);
    expect(res.formattedPercentage).toBe('75%');
    expect(res.isShortage).toBe(false);
    expect(res.status).toBe('Borderline'); // 75% is [75, 80)
    expect(res.classesNeeded).toBe(0);
    expect(res.canMiss).toBe(0); // floor(15 / 0.75 - 20) = floor(20 - 20) = 0
  });

  it('should calculate consecutive sessions needed when below threshold (x formula)', () => {
    // Attended: 12, Conducted: 20 -> 60% attendance. Target: 75%
    // r = 0.75. Numerator: 0.75 * 20 - 12 = 15 - 12 = 3
    // Denominator: 1 - 0.75 = 0.25
    // x = ceil(3 / 0.25) = 12 classes needed
    const res = calculateAttendance({ attended: 12, conducted: 20, targetPercentage: 75 });
    expect(res.percentage).toBe(60);
    expect(res.isShortage).toBe(true);
    expect(res.status).toBe('Below Required');
    expect(res.classesNeeded).toBe(12);
    expect(res.canMiss).toBe(0);

    // Verify: If student attends 12 more consecutive classes:
    // newAttended = 12 + 12 = 24. newConducted = 20 + 12 = 32. 24 / 32 = 75.0%
    const proj = projectFutureAttendance({ attended: 12, conducted: 20, futureAttend: 12, futureMiss: 0 });
    expect(proj.projectedPercentage).toBe(75);
  });

  it('should calculate classes that can be missed when above threshold (y formula)', () => {
    // Attended: 18, Conducted: 20 -> 90% attendance. Target: 75%
    // y = floor(18 / 0.75 - 20) = floor(24 - 20) = 4 classes
    const res = calculateAttendance({ attended: 18, conducted: 20, targetPercentage: 75 });
    expect(res.percentage).toBe(90);
    expect(res.isShortage).toBe(false);
    expect(res.classesNeeded).toBe(0);
    expect(res.canMiss).toBe(4);

    // Verify: If student misses 4 classes:
    // newAttended = 18. newConducted = 20 + 4 = 24. 18 / 24 = 75.0%
    const proj = projectFutureAttendance({ attended: 18, conducted: 20, futureAttend: 0, futureMiss: 4 });
    expect(proj.projectedPercentage).toBe(75);
  });

  it('should project future attendance correctly with both attend and miss', () => {
    // Current: 10/12 (~83.33%). Future attend: 5, future miss: 1.
    // New: 15/18 = 83.33%
    const proj = projectFutureAttendance({ attended: 10, conducted: 12, futureAttend: 5, futureMiss: 1 });
    expect(proj.newAttended).toBe(15);
    expect(proj.newConducted).toBe(18);
    expect(proj.projectedPercentage).toBe(83.33);
  });
});
