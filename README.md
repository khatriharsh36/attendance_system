# MITAOE Attendance Management System

A production-grade, full-stack academic attendance governance and forecasting web application built with the **MERN Stack** (MongoDB, Express.js, React.js, Node.js) for **MIT Academy of Engineering (MITAOE), Pune**.

Designed with an enterprise academic design language inspired by modern productivity software (Linear, Notion, GitHub Enterprise). Features strict role-based authorization, mathematical attendance forecasting, separate theory and practical component tracking, conflict-preventing timetable management, full-lifecycle correction requests, and immutable audit logging.

---

## 🏛️ Academic Structure & Key Capabilities

- **Institutional Identity**: Tailored for MITAOE autonomous curriculum (Semester & Division structure, Theory and Practical components with lab batches e.g., A1, A2).
- **Exact Mathematical Forecasting**:
  - Consecutive recovery lectures needed:
    $$x = \max\left(0, \left\lceil \frac{r \cdot \text{total} - \text{attended}}{1 - r} \right\rceil\right)$$
  - Permissible missed classes before shortage:
    $$y = \max\left(0, \left\lfloor \frac{\text{attended}}{r} - \text{total} \right\rfloor\right)$$
  - Real-time what-if scenario simulator for future class attend/miss projections.
- **Three Dedicated Role Portals**:
  1. **Student Portal**:
     - Live course-wise attendance tracking against configurable 75% threshold.
     - Automated shortage alert banners detailing exact recovery requirements.
     - Session-by-session history with interactive Recharts cumulative trendline.
     - Correction request submission for absent sessions with reason taxonomy.
     - Weekly timetable grid highlighting today's classes.
  2. **Faculty Portal**:
     - Fast roster-based attendance marking interface with live Present/Absent totals.
     - Bulk actions ("All Present", "All Absent") and instant PRN/name search.
     - Past session history with audited individual record adjustments.
     - End-to-end correction request approval/rejection with mandatory faculty remarks.
     - Course reports with 1-click CSV export and below-threshold defaulter filters.
  3. **HOD (Head of Department) Portal**:
     - Department-wide metrics (student count, faculty workload, aggregate attendance %).
     - Theory vs. practical attendance comparison analytics.
     - Interactive department threshold configuration (default 75%).
     - Course offering management and faculty workload assignments.
     - Master timetable scheduling with automatic room, faculty, and student conflict rejection.
     - Defaulter shortage report with institutional CSV download.
     - Read-only immutable administrative audit trail.

---

## 📦 Technology Stack

| Layer | Technologies |
|---|---|
| **Frontend** | React 18, Vite 6, Tailwind CSS, React Router DOM v6, Axios, Lucide React, Recharts |
| **Backend** | Node.js (ES Modules), Express.js, Mongoose 8, JWT, bcryptjs, cookie-parser, CORS, dotenv |
| **Database** | MongoDB (Native local server on port 27017 or MongoDB Atlas) |
| **Testing** | Vitest, Supertest (20 backend unit & integration tests) |
| **Architecture** | RESTful APIs, HttpOnly Cookie session authentication, Server-validated resource authorization |

---

## 🚀 Quick Start & Installation

### Prerequisites
- **Node.js**: v18.0.0 or higher (v22+ tested)
- **npm**: v9.0.0 or higher
- **MongoDB**: Local MongoDB running on standard port `27017` or a MongoDB Atlas URI.

### 1. Clone & Install Dependencies
From the repository root:
```bash
# Install root orchestration tools
npm install

# Install backend dependencies
cd backend
npm install
  
# Install frontend dependencies
cd ../frontend
npm install

# Return to root
cd ..
```

*(Alternatively, run `npm run install:all` from the root directory).*

---

### 2. Environment Configuration

The backend contains a pre-configured `.env` file (copied from `.env.example`):

`backend/.env`:
```env
PORT=5000
NODE_ENV=development
MONGO_URI=mongodb://127.0.0.1:27017/mitaoe_attendance
JWT_SECRET=mitaoe_attendance_management_secret_key_2026_dev
JWT_EXPIRES_IN=7d
CLIENT_URL=http://localhost:5173
DEFAULT_ATTENDANCE_THRESHOLD=75
```

---

### 3. Seed Realistic Demo Database

Execute the repeatable database seed script to populate realistic departments, faculty, 30 students, courses, historical conducted sessions (500+ attendance records), correction requests, timetables, and audit logs:

```bash
# From workspace root
npm run seed

# Or from backend folder
cd backend
npm run seed
```

---

### 4. Run Development Servers

Start both the Express API and Vite frontend simultaneously:

```bash
# From workspace root
npm run dev
```

Or run them in separate terminal windows:
```bash
# Terminal 1: Backend API (http://localhost:5000)
npm run dev:backend

# Terminal 2: Frontend Client (http://localhost:5173)
npm run dev:frontend
```

---

## 🔑 Pre-Seeded Demo Credentials

All demo accounts use the standard password: `Password123!`

The login screen (`/login`) includes **1-Click Demo Shortcut Buttons** that instantly sign into these accounts:

| Role | Name | Email | Password | PRN / Employee ID |
|---|---|---|---|---|
| **Student** | Aarav Sharma | `student.demo@mitaoe.ac.in` | `Password123!` | `2022BTECS001` (Div A) |
| **Faculty** | Prof. Rajesh Kulkarni | `faculty.demo@mitaoe.ac.in` | `Password123!` | `EMP-FAC-01` |
| **HOD** | Dr. Anand Kulkarni | `hod.demo@mitaoe.ac.in` | `Password123!` | `EMP-HOD-01` |

Additional pre-seeded accounts:
- **Dr. Sunita Patil** (Faculty): `sunita.patil@mitaoe.ac.in`
- **Prof. Amit Deshmukh** (Faculty): `amit.deshmukh@mitaoe.ac.in`
- **Prof. Neha Sharma** (Faculty): `neha.sharma@mitaoe.ac.in`
- **Priya Nair** (Student, 100% attendance): `priya.nair@mitaoe.ac.in`
- **Vivek Chavan** (Student, Defaulter <70%): `vivek.chavan@mitaoe.ac.in`

---

## 🧪 Automated Testing

The project includes unit and integration tests covering mathematical formulas, authentication, role authorization boundaries, duplicate prevention, timetable conflict rejection, and correction request workflows:

```bash
# From backend directory
cd backend
npm test
```

### Test Coverage Summary:
- ✅ Attendance forecasting formulas ($x$ and $y$ calculations)
- ✅ Zero-session handling and boundary states (exact 75%, 100%)
- ✅ Student & Faculty registration and duplicate email/PRN rejection
- ✅ Public HOD registration prevention (HTTP 403)
- ✅ Valid and invalid login authentication
- ✅ Role-based endpoint protection (Students cannot access faculty/HOD routes)
- ✅ Resource ownership enforcement (Faculty cannot mark attendance for unassigned courses)
- ✅ Prevention of future dates recorded as conducted sessions
- ✅ Prevention of duplicate attendance records for the same student/session
- ✅ Timetable conflict detection (Room overlap, Faculty overlap, Student Group overlap)
- ✅ Attendance correction approval updates and audit trail logging

---

## 📁 Project Architecture

```
attendance_system/
├── package.json                 # Monorepo dev and build scripts
├── README.md                    # Institutional documentation
├── backend/
│   ├── config/
│   │   └── db.js                # Mongoose connection configuration
│   ├── models/
│   │   ├── User.js              # Student, Faculty, and HOD accounts
│   │   ├── Course.js            # Theory & Practical course offerings
│   │   ├── Enrollment.js        # Student-course relational enrollments
│   │   ├── Session.js           # Conducted and scheduled class sessions
│   │   ├── Attendance.js        # Individual student attendance records
│   │   ├── Timetable.js         # Weekly timetable schedule slots
│   │   ├── CorrectionRequest.js # Correction review workflow
│   │   ├── AuditLog.js          # Compliance and change audit logging
│   │   └── DepartmentConfig.js  # Department settings and threshold
│   ├── controllers/             # Express API controllers
│   ├── routes/                  # API route definitions
│   ├── middleware/              # JWT auth and role authorization
│   ├── utils/                   # Formulas and CSV generator
│   ├── seed/
│   │   └── seed.js              # Database seed script
│   ├── tests/                   # Automated Vitest test suite
│   ├── app.js                   # Express application setup
│   └── server.js                # Server entry point
└── frontend/
    ├── src/
    │   ├── components/          # Reusable UI design system components
    │   ├── layouts/             # AppLayout, Sidebar, Header
    │   ├── context/             # AuthContext, ToastContext
    │   ├── pages/
    │   │   ├── auth/            # Login and Register pages
    │   │   ├── student/         # Student portal pages
    │   │   ├── faculty/         # Faculty portal pages
    │   │   └── hod/             # HOD portal pages
    │   ├── services/            # Axios API client
    │   ├── utils/               # Formatting and reactive calculation helpers
    │   ├── App.jsx              # React Router setup
    │   └── main.jsx             # React DOM entry
    ├── vite.config.js           # Vite dev server and proxy
    └── tailwind.config.js       # University palette tokens
```

---

## 🛡️ Security & Data Integrity

- **Password Security**: Salted bcrypt password hashes; passwords never stored or returned in plaintext.
- **Session Tokens**: JWT stored in secure `HttpOnly` cookies with cross-site `lax` same-site policy and Bearer header fallback.
- **Strict Authorization**: Identity derived exclusively from verified JWT server-side; client cannot spoof roles or IDs.
- **Database Constraints**: Unique indexes on `{ sessionId, studentId }` prevent duplicate attendance; unique enrollments; unique timetable slots.
- **Audit Logging**: Every attendance marking, manual modification, faculty correction approval, and schedule creation generates an immutable `AuditLog` entry.

---

## 📄 License & Attribution

Developed for **MIT Academy of Engineering, Pune**. Autonomous Institute Affiliated to Savitribai Phule Pune University (SPPU).
