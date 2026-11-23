import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';
import { AppLayout } from './layouts/AppLayout';

// Auth Pages
import { Login } from './pages/auth/Login';
import { Register } from './pages/auth/Register';
import { NotFound } from './pages/NotFound';

// Student Pages
import { StudentDashboard } from './pages/student/Dashboard';
import { MyAttendance } from './pages/student/MyAttendance';
import { CourseDetails } from './pages/student/CourseDetails';
import { AttendanceCalculator } from './pages/student/AttendanceCalculator';
import { StudentTimetable } from './pages/student/StudentTimetable';
import { CorrectionRequests } from './pages/student/CorrectionRequests';
import { StudentProfile } from './pages/student/Profile';

// Faculty Pages
import { FacultyDashboard } from './pages/faculty/Dashboard';
import { MyCourses } from './pages/faculty/MyCourses';
import { MarkAttendance } from './pages/faculty/MarkAttendance';
import { AttendanceHistory } from './pages/faculty/AttendanceHistory';
import { FacultyTimetable } from './pages/faculty/FacultyTimetable';
import { FacultyCorrections } from './pages/faculty/FacultyCorrections';
import { FacultyReports } from './pages/faculty/FacultyReports';
import { FacultyProfile } from './pages/faculty/Profile';

// HOD Pages
import { HODDashboard } from './pages/hod/Dashboard';
import { StudentManagement } from './pages/hod/StudentManagement';
import { FacultyManagement } from './pages/hod/FacultyManagement';
import { CourseManagement } from './pages/hod/CourseManagement';
import { TimetableManagement } from './pages/hod/TimetableManagement';
import { ShortageReport } from './pages/hod/ShortageReport';
import { AuditLogs } from './pages/hod/AuditLogs';
import { HODProfile } from './pages/hod/Profile';

// Root redirector based on authenticated user role
const RootRedirect = () => {
  const { user, isAuthenticated, loading } = useAuth();

  if (loading) return null;

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (user?.role === 'student') return <Navigate to="/student/dashboard" replace />;
  if (user?.role === 'faculty') return <Navigate to="/faculty/dashboard" replace />;
  if (user?.role === 'hod') return <Navigate to="/hod/dashboard" replace />;

  return <Navigate to="/login" replace />;
};

export const App = () => {
  return (
    <BrowserRouter>
      <AuthProvider>
        <ToastProvider>
          <Routes>
            {/* Public Auth Routes */}
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/" element={<RootRedirect />} />

            {/* Student Role Routes */}
            <Route element={<AppLayout allowedRoles={['student']} />}>
              <Route path="/student/dashboard" element={<StudentDashboard />} />
              <Route path="/student/attendance" element={<MyAttendance />} />
              <Route path="/student/courses/:courseId" element={<CourseDetails />} />
              <Route path="/student/calculator" element={<AttendanceCalculator />} />
              <Route path="/student/timetable" element={<StudentTimetable />} />
              <Route path="/student/corrections" element={<CorrectionRequests />} />
              <Route path="/student/profile" element={<StudentProfile />} />
            </Route>

            {/* Faculty Role Routes */}
            <Route element={<AppLayout allowedRoles={['faculty']} />}>
              <Route path="/faculty/dashboard" element={<FacultyDashboard />} />
              <Route path="/faculty/courses" element={<MyCourses />} />
              <Route path="/faculty/attendance/mark" element={<MarkAttendance />} />
              <Route path="/faculty/attendance/history" element={<AttendanceHistory />} />
              <Route path="/faculty/timetable" element={<FacultyTimetable />} />
              <Route path="/faculty/corrections" element={<FacultyCorrections />} />
              <Route path="/faculty/reports" element={<FacultyReports />} />
              <Route path="/faculty/profile" element={<FacultyProfile />} />
            </Route>

            {/* HOD Role Routes */}
            <Route element={<AppLayout allowedRoles={['hod']} />}>
              <Route path="/hod/dashboard" element={<HODDashboard />} />
              <Route path="/hod/students" element={<StudentManagement />} />
              <Route path="/hod/faculty" element={<FacultyManagement />} />
              <Route path="/hod/courses" element={<CourseManagement />} />
              <Route path="/hod/timetable" element={<TimetableManagement />} />
              <Route path="/hod/shortages" element={<ShortageReport />} />
              <Route path="/hod/audit-logs" element={<AuditLogs />} />
              <Route path="/hod/profile" element={<HODProfile />} />
            </Route>

            {/* 404 Catch All */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </ToastProvider>
      </AuthProvider>
    </BrowserRouter>
  );
};

export default App;
