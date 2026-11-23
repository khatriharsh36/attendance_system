import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { User } from '../models/User.js';
import { Course } from '../models/Course.js';
import { Enrollment } from '../models/Enrollment.js';
import { Timetable } from '../models/Timetable.js';
import { Session } from '../models/Session.js';
import { Attendance } from '../models/Attendance.js';
import { CorrectionRequest } from '../models/CorrectionRequest.js';
import { AuditLog } from '../models/AuditLog.js';
import { DepartmentConfig } from '../models/DepartmentConfig.js';

dotenv.config();

const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/mitaoe_attendance';
const DEMO_PASSWORD = 'Password123!';

export const seedDatabase = async () => {
  try {
    console.log('[Seed] Connecting to MongoDB...');
    await mongoose.connect(MONGO_URI);
    console.log('[Seed] Connected successfully.');

    // Clear existing collections safely
    console.log('[Seed] Cleaning old records...');
    await Promise.all([
      User.deleteMany({}),
      Course.deleteMany({}),
      Enrollment.deleteMany({}),
      Timetable.deleteMany({}),
      Session.deleteMany({}),
      Attendance.deleteMany({}),
      CorrectionRequest.deleteMany({}),
      AuditLog.deleteMany({}),
      DepartmentConfig.deleteMany({}),
    ]);

    // 1. Department Configurations
    console.log('[Seed] Creating Department Configurations...');
    const compDept = await DepartmentConfig.create({
      name: 'Computer Engineering',
      code: 'COMP',
      minimumAttendanceThreshold: 75,
    });
    await DepartmentConfig.create({
      name: 'Information Technology',
      code: 'IT',
      minimumAttendanceThreshold: 75,
    });
    await DepartmentConfig.create({
      name: 'Electronics Engineering',
      code: 'ETX',
      minimumAttendanceThreshold: 75,
    });
    await DepartmentConfig.create({
      name: 'Mechanical Engineering',
      code: 'MECH',
      minimumAttendanceThreshold: 75,
    });

    // 2. Users: 1 HOD, 4 Faculty, 30 Students
    console.log('[Seed] Creating HOD and Faculty...');
    const hod = await User.create({
      name: 'Dr. Anand Kulkarni',
      email: 'hod.demo@mitaoe.ac.in',
      password: DEMO_PASSWORD,
      role: 'hod',
      facultyId: 'EMP-HOD-01',
      department: 'Computer Engineering',
    });

    compDept.hodId = hod._id;
    await compDept.save();

    const faculty1 = await User.create({
      name: 'Prof. Rajesh Kulkarni',
      email: 'faculty.demo@mitaoe.ac.in',
      password: DEMO_PASSWORD,
      role: 'faculty',
      facultyId: 'EMP-FAC-01',
      department: 'Computer Engineering',
    });

    const faculty2 = await User.create({
      name: 'Dr. Sunita Patil',
      email: 'sunita.patil@mitaoe.ac.in',
      password: DEMO_PASSWORD,
      role: 'faculty',
      facultyId: 'EMP-FAC-02',
      department: 'Computer Engineering',
    });

    const faculty3 = await User.create({
      name: 'Prof. Amit Deshmukh',
      email: 'amit.deshmukh@mitaoe.ac.in',
      password: DEMO_PASSWORD,
      role: 'faculty',
      facultyId: 'EMP-FAC-03',
      department: 'Computer Engineering',
    });

    const faculty4 = await User.create({
      name: 'Prof. Neha Sharma',
      email: 'neha.sharma@mitaoe.ac.in',
      password: DEMO_PASSWORD,
      role: 'faculty',
      facultyId: 'EMP-FAC-04',
      department: 'Computer Engineering',
    });

    // 3. Students
    console.log('[Seed] Creating Students (30 accounts)...');
    const studentDemo = await User.create({
      name: 'Aarav Sharma',
      email: 'student.demo@mitaoe.ac.in',
      password: DEMO_PASSWORD,
      role: 'student',
      studentId: '2022BTECS001',
      department: 'Computer Engineering',
      academicYear: 'Third Year',
      semester: 5,
      division: 'A',
    });

    const studentNamesDivA = [
      'Priya Nair', 'Rohan Verma', 'Isha Gupta', 'Aditya Joshi', 'Ananya Iyer',
      'Kabir Mehta', 'Tanvi Shinde', 'Siddharth Rao', 'Pooja Kadam', 'Vivek Chavan',
      'Meera Kulkarni', 'Arjun Saxena', 'Rhea Deshmukh', 'Yash Gaikwad', 'Divya Mahajan'
    ];

    const studentNamesDivB = [
      'Devansh Joshi', 'Sneha Patil', 'Varun Reddy', 'Kavya Pillai', 'Manish More',
      'Sanjana Bhat', 'Karan Thakur', 'Nisha Sen', 'Omkar Jadhav', 'Shruti Kale',
      'Harsh Vardhan', 'Avani Dixit', 'Gaurav Solanki', 'Ritu Aggarwal'
    ];

    const studentsA = [studentDemo];
    for (let i = 0; i < studentNamesDivA.length; i++) {
      const prnNum = (i + 2).toString().padStart(3, '0');
      const s = await User.create({
        name: studentNamesDivA[i],
        email: `${studentNamesDivA[i].toLowerCase().replace(/\s+/g, '.')}@mitaoe.ac.in`,
        password: DEMO_PASSWORD,
        role: 'student',
        studentId: `2022BTECS${prnNum}`,
        department: 'Computer Engineering',
        academicYear: 'Third Year',
        semester: 5,
        division: 'A',
      });
      studentsA.push(s);
    }

    const studentsB = [];
    for (let i = 0; i < studentNamesDivB.length; i++) {
      const prnNum = (i + 20).toString().padStart(3, '0');
      const s = await User.create({
        name: studentNamesDivB[i],
        email: `${studentNamesDivB[i].toLowerCase().replace(/\s+/g, '.')}@mitaoe.ac.in`,
        password: DEMO_PASSWORD,
        role: 'student',
        studentId: `2022BTECS${prnNum}`,
        department: 'Computer Engineering',
        academicYear: 'Third Year',
        semester: 5,
        division: 'B',
      });
      studentsB.push(s);
    }

    const allStudents = [...studentsA, ...studentsB];

    // 4. Courses (Theory & Practical components tracked separately)
    console.log('[Seed] Creating Course Offerings...');
    const courseOS_Th = await Course.create({
      code: 'CS501',
      name: 'Operating Systems (Theory)',
      department: 'Computer Engineering',
      semester: 5,
      type: 'theory',
      facultyId: faculty1._id,
      division: 'A',
      credits: 3,
    });

    const courseOS_Prac_A1 = await Course.create({
      code: 'CS501L',
      name: 'Operating Systems Lab',
      department: 'Computer Engineering',
      semester: 5,
      type: 'practical',
      facultyId: faculty1._id,
      division: 'A',
      batch: 'A1',
      credits: 1,
    });

    const courseOS_Prac_A2 = await Course.create({
      code: 'CS501L',
      name: 'Operating Systems Lab',
      department: 'Computer Engineering',
      semester: 5,
      type: 'practical',
      facultyId: faculty1._id,
      division: 'A',
      batch: 'A2',
      credits: 1,
    });

    const courseDBMS_Th = await Course.create({
      code: 'CS502',
      name: 'Database Management Systems (Theory)',
      department: 'Computer Engineering',
      semester: 5,
      type: 'theory',
      facultyId: faculty2._id,
      division: 'A',
      credits: 3,
    });

    const courseDBMS_Prac = await Course.create({
      code: 'CS502L',
      name: 'Database Management Systems Lab',
      department: 'Computer Engineering',
      semester: 5,
      type: 'practical',
      facultyId: faculty2._id,
      division: 'A',
      batch: 'A1',
      credits: 1,
    });

    const courseCN_Th = await Course.create({
      code: 'CS503',
      name: 'Computer Networks (Theory)',
      department: 'Computer Engineering',
      semester: 5,
      type: 'theory',
      facultyId: faculty3._id,
      division: 'A',
      credits: 3,
    });

    const courseTOC_Th = await Course.create({
      code: 'CS504',
      name: 'Theory of Computation',
      department: 'Computer Engineering',
      semester: 5,
      type: 'theory',
      facultyId: faculty4._id,
      division: 'A',
      credits: 3,
    });

    // Division B courses
    const courseOS_DivB = await Course.create({
      code: 'CS501',
      name: 'Operating Systems (Theory)',
      department: 'Computer Engineering',
      semester: 5,
      type: 'theory',
      facultyId: faculty1._id,
      division: 'B',
      credits: 3,
    });

    // 5. Enrollments
    console.log('[Seed] Creating Student Enrollments...');
    const enrollmentDocs = [];
    
    // Div A theory courses
    for (const student of studentsA) {
      enrollmentDocs.push({ studentId: student._id, courseId: courseOS_Th._id });
      enrollmentDocs.push({ studentId: student._id, courseId: courseDBMS_Th._id });
      enrollmentDocs.push({ studentId: student._id, courseId: courseCN_Th._id });
      enrollmentDocs.push({ studentId: student._id, courseId: courseTOC_Th._id });
    }

    // Split Div A students into practical batches A1 (first 8) and A2 (remaining 8)
    for (let i = 0; i < studentsA.length; i++) {
      const student = studentsA[i];
      if (i < 8) {
        enrollmentDocs.push({ studentId: student._id, courseId: courseOS_Prac_A1._id, batch: 'A1' });
        enrollmentDocs.push({ studentId: student._id, courseId: courseDBMS_Prac._id, batch: 'A1' });
      } else {
        enrollmentDocs.push({ studentId: student._id, courseId: courseOS_Prac_A2._id, batch: 'A2' });
      }
    }

    // Div B enrollments
    for (const student of studentsB) {
      enrollmentDocs.push({ studentId: student._id, courseId: courseOS_DivB._id });
    }

    await Enrollment.insertMany(enrollmentDocs);

    // 6. Timetable
    console.log('[Seed] Creating Timetable Entries...');
    await Timetable.create([
      {
        courseId: courseOS_Th._id,
        facultyId: faculty1._id,
        day: 'Monday',
        startTime: '09:15',
        endTime: '10:15',
        room: 'Room 304',
        division: 'A',
      },
      {
        courseId: courseDBMS_Th._id,
        facultyId: faculty2._id,
        day: 'Monday',
        startTime: '10:30',
        endTime: '11:30',
        room: 'Room 304',
        division: 'A',
      },
      {
        courseId: courseOS_Prac_A1._id,
        facultyId: faculty1._id,
        day: 'Monday',
        startTime: '13:00',
        endTime: '15:00',
        room: 'Systems Lab 202',
        division: 'A',
        batch: 'A1',
      },
      {
        courseId: courseCN_Th._id,
        facultyId: faculty3._id,
        day: 'Tuesday',
        startTime: '09:15',
        endTime: '10:15',
        room: 'Room 304',
        division: 'A',
      },
      {
        courseId: courseOS_Th._id,
        facultyId: faculty1._id,
        day: 'Tuesday',
        startTime: '10:30',
        endTime: '11:30',
        room: 'Room 304',
        division: 'A',
      },
      {
        courseId: courseTOC_Th._id,
        facultyId: faculty4._id,
        day: 'Wednesday',
        startTime: '09:15',
        endTime: '10:15',
        room: 'Room 304',
        division: 'A',
      },
      {
        courseId: courseDBMS_Th._id,
        facultyId: faculty2._id,
        day: 'Wednesday',
        startTime: '11:30',
        endTime: '12:30',
        room: 'Room 304',
        division: 'A',
      },
      {
        courseId: courseOS_Th._id,
        facultyId: faculty1._id,
        day: 'Thursday',
        startTime: '09:15',
        endTime: '10:15',
        room: 'Room 304',
        division: 'A',
      },
      {
        courseId: courseCN_Th._id,
        facultyId: faculty3._id,
        day: 'Thursday',
        startTime: '10:30',
        endTime: '11:30',
        room: 'Room 304',
        division: 'A',
      },
      {
        courseId: courseTOC_Th._id,
        facultyId: faculty4._id,
        day: 'Friday',
        startTime: '10:30',
        endTime: '11:30',
        room: 'Room 304',
        division: 'A',
      },
      // Div B slot
      {
        courseId: courseOS_DivB._id,
        facultyId: faculty1._id,
        day: 'Monday',
        startTime: '11:30',
        endTime: '12:30',
        room: 'Room 305',
        division: 'B',
      },
    ]);

    // 7. Historical Sessions and Attendance Records
    console.log('[Seed] Generating Historical Sessions & Attendance records...');
    
    // Generate past 20 sessions for OS Theory Div A across last 4 weeks
    const today = new Date();
    const sessionDates = [];
    for (let d = 28; d >= 1; d--) {
      const date = new Date(today);
      date.setDate(today.getDate() - d);
      // Skip weekends (0 is Sun, 6 is Sat)
      if (date.getDay() !== 0 && date.getDay() !== 6) {
        sessionDates.push(date);
      }
    }

    const osSessions = [];
    const attendanceRecords = [];

    // Let's create 16 conducted sessions for CS501 OS Theory
    const topicsOS = [
      'Introduction to Operating Systems & Architecture',
      'Process States, Lifecycle and Process Control Blocks',
      'CPU Scheduling Algorithms: FCFS and SJF',
      'CPU Scheduling: Priority and Round Robin Scheduling',
      'Inter-Process Communication: Shared Memory and Message Passing',
      'Process Synchronization and Critical Section Problem',
      'Peterson Solution and Hardware Synchronization Instructions',
      'Semaphores: Binary and Counting Semaphores',
      'Classical Synchronization Problems: Bounded Buffer and Producer-Consumer',
      'The Dining Philosophers Problem & Monitors',
      'Deadlock Conditions and System Resource Allocation Graph',
      'Deadlock Prevention & Avoidance: Banker Algorithm',
      'Memory Management: Logical vs Physical Addressing',
      'Contiguous Memory Allocation and Paging Basics',
      'Page Replacement Algorithms: FIFO, LRU, Optimal',
      'Virtual Memory & Demand Paging Thrashing',
    ];

    for (let i = 0; i < topicsOS.length; i++) {
      const sDate = sessionDates[i] || new Date();
      const session = await Session.create({
        courseId: courseOS_Th._id,
        facultyId: faculty1._id,
        sessionDate: sDate,
        startTime: '09:15',
        endTime: '10:15',
        topic: topicsOS[i],
        status: 'conducted',
        presentCount: 0,
        absentCount: 0,
      });
      osSessions.push(session);

      let pCount = 0;
      let aCount = 0;

      // Populate attendance for all students in Div A
      for (const student of studentsA) {
        let isPresent = true;

        // Specific attendance profiles:
        // Student Demo (student.demo): 14 present, 2 absent -> 14/16 = 87.5%
        if (student.email === 'student.demo@mitaoe.ac.in') {
          if (i === 3 || i === 9) {
            isPresent = false;
          }
        }
        // Below 75% attendance student: Vivek Chavan (index 10) -> present only in 10 sessions -> 10/16 = 62.5%
        else if (student.name === 'Vivek Chavan') {
          if (i % 3 === 0) isPresent = false;
        }
        // Borderline student: Tanvi Shinde (index 7) -> 12 present, 4 absent -> 12/16 = 75%
        else if (student.name === 'Tanvi Shinde') {
          if (i % 4 === 0) isPresent = false;
        }
        // High attendance student: Priya Nair -> 16/16 = 100%
        else if (student.name === 'Priya Nair') {
          isPresent = true;
        } else {
          // Other students: realistic probability (~80%)
          isPresent = (student.studentId.charCodeAt(student.studentId.length - 1) + i) % 5 !== 0;
        }

        if (isPresent) pCount++;
        else aCount++;

        attendanceRecords.push({
          sessionId: session._id,
          courseId: courseOS_Th._id,
          studentId: student._id,
          status: isPresent ? 'present' : 'absent',
          markedBy: faculty1._id,
          markedAt: sDate,
        });
      }

      session.presentCount = pCount;
      session.absentCount = aCount;
      await session.save();
    }

    // Sessions for DBMS Theory (14 sessions) - faculty2
    const topicsDBMS = [
      'Relational Model Concepts and ER Modeling',
      'Extended ER Features and Mapping to Relational Schema',
      'Relational Algebra and Tuple Relational Calculus',
      'SQL DDL, DML and Integrity Constraints',
      'Complex SQL Queries, Subqueries and Joins',
      'Functional Dependencies and 1NF, 2NF',
      'Third Normal Form and BCNF Decomposition',
      'Multi-valued Dependencies and 4NF',
      'Transaction Concepts and ACID Properties',
      'Schedules and Serializability Testing',
      'Concurrency Control Protocols: Two-Phase Locking',
      'Timestamp Ordering Protocol and Deadlock Handling',
      'Database Recovery: Log-Based Recovery Schemes',
      'Indexing Techniques: B+ Trees and Hashing',
    ];

    for (let i = 0; i < topicsDBMS.length; i++) {
      const sDate = sessionDates[i] || new Date();
      const session = await Session.create({
        courseId: courseDBMS_Th._id,
        facultyId: faculty2._id,
        sessionDate: sDate,
        startTime: '10:30',
        endTime: '11:30',
        topic: topicsDBMS[i],
        status: 'conducted',
        presentCount: 0,
        absentCount: 0,
      });

      let pCount = 0;
      let aCount = 0;

      for (const student of studentsA) {
        let isPresent = true;
        // In DBMS, give student.demo 10/14 = 71.4% (Below 75%) so demo shows a real shortage warning!
        if (student.email === 'student.demo@mitaoe.ac.in') {
          if (i === 1 || i === 4 || i === 7 || i === 11) {
            isPresent = false;
          }
        } else if (student.name === 'Vivek Chavan') {
          if (i % 2 === 0) isPresent = false;
        } else {
          isPresent = (student.studentId.charCodeAt(student.studentId.length - 1) + i) % 4 !== 0;
        }

        if (isPresent) pCount++;
        else aCount++;

        attendanceRecords.push({
          sessionId: session._id,
          courseId: courseDBMS_Th._id,
          studentId: student._id,
          status: isPresent ? 'present' : 'absent',
          markedBy: faculty2._id,
          markedAt: sDate,
        });
      }

      session.presentCount = pCount;
      session.absentCount = aCount;
      await session.save();
    }

    // Sessions for OS Lab Batch A1 (8 practical sessions)
    const batchA1Students = studentsA.slice(0, 8);
    const topicsOSLab = [
      'Linux Shell Scripting & Basic Commands',
      'Process Creation using fork() and exec() system calls',
      'Thread Programming using POSIX pthreads',
      'Simulating FCFS and SJF Scheduling Algorithms in C',
      'Simulating Round Robin & Priority Scheduling in C',
      'Inter-process Communication using UNIX Pipes & FIFOs',
      'Synchronization using POSIX Mutex and Semaphores',
      'Banker Algorithm Implementation for Deadlock Avoidance',
    ];

    for (let i = 0; i < topicsOSLab.length; i++) {
      const sDate = sessionDates[i * 2] || new Date();
      const session = await Session.create({
        courseId: courseOS_Prac_A1._id,
        facultyId: faculty1._id,
        sessionDate: sDate,
        startTime: '13:00',
        endTime: '15:00',
        topic: topicsOSLab[i],
        batch: 'A1',
        status: 'conducted',
        presentCount: 0,
        absentCount: 0,
      });

      let pCount = 0;
      let aCount = 0;

      for (const student of batchA1Students) {
        let isPresent = true;
        if (student.email === 'student.demo@mitaoe.ac.in') {
          // 7 present, 1 absent -> 87.5%
          if (i === 4) isPresent = false;
        } else {
          isPresent = (i + student.studentId.charCodeAt(student.studentId.length - 1)) % 6 !== 0;
        }

        if (isPresent) pCount++;
        else aCount++;

        attendanceRecords.push({
          sessionId: session._id,
          courseId: courseOS_Prac_A1._id,
          studentId: student._id,
          status: isPresent ? 'present' : 'absent',
          markedBy: faculty1._id,
          markedAt: sDate,
        });
      }

      session.presentCount = pCount;
      session.absentCount = aCount;
      await session.save();
    }

    await Attendance.insertMany(attendanceRecords);

    // 8. Correction Requests
    console.log('[Seed] Creating Attendance Correction Requests...');
    // Request 1: Pending from student.demo for OS session #3 (which was absent)
    const pendingSession = osSessions[3];
    await CorrectionRequest.create({
      studentId: studentDemo._id,
      sessionId: pendingSession._id,
      courseId: courseOS_Th._id,
      reason: 'Medical Leave',
      description: 'Had high fever and visited campus clinic. Medical certificate attached and submitted to department office.',
      status: 'pending',
    });

    // Request 2: Approved from Tanvi Shinde for OS session #0
    const approvedSession = osSessions[0];
    const tanvi = studentsA.find((s) => s.name === 'Tanvi Shinde');
    if (tanvi) {
      await CorrectionRequest.create({
        studentId: tanvi._id,
        sessionId: approvedSession._id,
        courseId: courseOS_Th._id,
        reason: 'On-Duty College Activity',
        description: 'Represented MITAOE at Smart India Hackathon internal round with prior approval from HOD.',
        status: 'approved',
        facultyResponse: 'Verified with Hackathon coordinator. Attendance granted.',
        reviewedBy: faculty1._id,
        reviewedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
      });
    }

    // Request 3: Rejected from Vivek Chavan for OS session #4
    const rejectedSession = osSessions[4];
    const vivek = studentsA.find((s) => s.name === 'Vivek Chavan');
    if (vivek) {
      await CorrectionRequest.create({
        studentId: vivek._id,
        sessionId: rejectedSession._id,
        courseId: courseOS_Th._id,
        reason: 'Technical / System Error',
        description: 'I was present in the last row and my attendance was missed by mistake.',
        status: 'rejected',
        facultyResponse: 'Cross-checked with session attendance sheet and video log; student was absent.',
        reviewedBy: faculty1._id,
        reviewedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
      });
    }

    // 9. Audit Logs
    console.log('[Seed] Creating Audit Logs...');
    await AuditLog.create([
      {
        actorId: hod._id,
        action: 'COURSE_CREATED',
        entityType: 'Course',
        entityId: courseOS_Th._id,
        courseId: courseOS_Th._id,
        details: 'HOD initialized course offering CS501 Operating Systems for Semester 5 Division A',
      },
      {
        actorId: hod._id,
        action: 'FACULTY_ASSIGNED',
        entityType: 'Course',
        entityId: courseOS_Th._id,
        courseId: courseOS_Th._id,
        oldValue: null,
        newValue: faculty1.name,
        details: `Assigned ${faculty1.name} to CS501 Operating Systems`,
      },
      {
        actorId: faculty1._id,
        action: 'ATTENDANCE_MARKED',
        entityType: 'Attendance',
        entityId: osSessions[0]._id,
        courseId: courseOS_Th._id,
        details: `Marked attendance for session ${topicsOS[0]} (${osSessions[0].presentCount} present, ${osSessions[0].absentCount} absent)`,
      },
      {
        actorId: faculty1._id,
        action: 'CORRECTION_APPROVED',
        entityType: 'CorrectionRequest',
        entityId: approvedSession._id,
        courseId: courseOS_Th._id,
        studentId: tanvi?._id,
        oldValue: 'absent',
        newValue: 'present',
        details: 'Approved on-duty correction request for Tanvi Shinde',
      },
    ]);

    console.log('\n======================================================');
    console.log('✅ MITAOE Attendance Management System SEED SUCCESSFUL');
    console.log('======================================================');
    console.log(`HOD:     hod.demo@mitaoe.ac.in     (Pass: ${DEMO_PASSWORD})`);
    console.log(`Faculty: faculty.demo@mitaoe.ac.in (Pass: ${DEMO_PASSWORD})`);
    console.log(`Student: student.demo@mitaoe.ac.in (Pass: ${DEMO_PASSWORD})`);
    console.log(`Total Students:    ${allStudents.length}`);
    console.log(`Total Courses:     7 (Theory + Practical)`);
    console.log(`Total Sessions:    ${osSessions.length + topicsDBMS.length + topicsOSLab.length}`);
    console.log(`Attendance Records:${attendanceRecords.length}`);
    console.log('======================================================\n');

    return true;
  } catch (error) {
    console.error('[Seed Error] Failed to seed database:', error);
    throw error;
  }
};

// If run directly from CLI
if (process.argv[1]?.endsWith('seed.js')) {
  seedDatabase()
    .then(() => {
      mongoose.connection.close();
      process.exit(0);
    })
    .catch((err) => {
      mongoose.connection.close();
      process.exit(1);
    });
}
