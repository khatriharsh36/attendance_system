import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { UserPlus, ArrowLeft, GraduationCap, Briefcase } from 'lucide-react';

const DEPARTMENTS = [
  'Computer Engineering',
  'Information Technology',
  'Electronics Engineering',
  'Mechanical Engineering',
];

export const Register = () => {
  const [role, setRole] = useState('student');
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    studentId: '',
    facultyId: '',
    department: 'Computer Engineering',
    academicYear: 'Third Year',
    semester: '5',
    division: 'A',
  });
  const [submitting, setSubmitting] = useState(false);

  const { register } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (formData.password !== formData.confirmPassword) {
      showToast('Passwords do not match.', 'error');
      return;
    }

    if (formData.password.length < 6) {
      showToast('Password must be at least 6 characters.', 'error');
      return;
    }

    if (role === 'student' && !formData.studentId) {
      showToast('PRN / Student ID is required.', 'error');
      return;
    }

    if (role === 'faculty' && !formData.facultyId) {
      showToast('Faculty Employee ID is required.', 'error');
      return;
    }

    try {
      setSubmitting(true);
      const payload = {
        role,
        name: formData.name.trim(),
        email: formData.email.trim().toLowerCase(),
        password: formData.password,
        department: formData.department,
        ...(role === 'student' && {
          studentId: formData.studentId.trim().toUpperCase(),
          academicYear: formData.academicYear,
          semester: Number(formData.semester),
          division: formData.division.toUpperCase(),
        }),
        ...(role === 'faculty' && {
          facultyId: formData.facultyId.trim().toUpperCase(),
        }),
      };

      const user = await register(payload);
      showToast(`Account registered successfully as ${user.name}!`, 'success');

      if (user.role === 'student') navigate('/student/dashboard');
      else navigate('/faculty/dashboard');
    } catch (err) {
      const msg = err.response?.data?.message || 'Registration failed.';
      showToast(msg, 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-surface-muted flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-2xl">
        <div className="bg-surface rounded-card border border-border shadow-dropdown p-8">
          
          <div className="flex items-center justify-between pb-4 border-b border-border mb-6">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-md bg-navy flex items-center justify-center p-1">
                <img src="/mitaoe-seal.svg" alt="MITAOE" className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-navy">MITAOE Registration</h2>
                <p className="text-xs text-brandText-secondary">Create your academic portal credentials</p>
              </div>
            </div>
            <Link
              to="/login"
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-academic hover:underline"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              Back to Sign In
            </Link>
          </div>

          {/* Role Selection Tabs */}
          <div className="flex rounded-lg bg-surface-subtle p-1 mb-6 border border-border">
            <button
              type="button"
              onClick={() => setRole('student')}
              className={`flex-1 flex items-center justify-center gap-2 py-2 text-xs font-semibold rounded-md transition ${
                role === 'student'
                  ? 'bg-surface text-navy shadow-xs border border-border'
                  : 'text-brandText-secondary hover:text-navy'
              }`}
            >
              <GraduationCap className="w-4 h-4 text-academic" />
              Student Registration
            </button>
            <button
              type="button"
              onClick={() => setRole('faculty')}
              className={`flex-1 flex items-center justify-center gap-2 py-2 text-xs font-semibold rounded-md transition ${
                role === 'faculty'
                  ? 'bg-surface text-navy shadow-xs border border-border'
                  : 'text-brandText-secondary hover:text-navy'
              }`}
            >
              <Briefcase className="w-4 h-4 text-academic" />
              Faculty Registration
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-navy mb-1.5">
                  Full Name <span className="text-status-danger">*</span>
                </label>
                <input
                  type="text"
                  required
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="e.g. Aarav Sharma"
                  className="w-full px-3 py-2 text-sm bg-surface rounded-md border border-border text-brandText-main focus:border-academic focus:ring-1 focus:ring-academic transition"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-navy mb-1.5">
                  College Email <span className="text-status-danger">*</span>
                </label>
                <input
                  type="email"
                  required
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="name@mitaoe.ac.in"
                  className="w-full px-3 py-2 text-sm bg-surface rounded-md border border-border text-brandText-main focus:border-academic focus:ring-1 focus:ring-academic transition"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {role === 'student' ? (
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-navy mb-1.5">
                    PRN / Student ID <span className="text-status-danger">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    name="studentId"
                    value={formData.studentId}
                    onChange={handleChange}
                    placeholder="e.g. 2022BTECS001"
                    className="w-full px-3 py-2 text-sm bg-surface rounded-md border border-border text-brandText-main focus:border-academic focus:ring-1 focus:ring-academic transition uppercase"
                  />
                </div>
              ) : (
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-navy mb-1.5">
                    Faculty / Employee ID <span className="text-status-danger">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    name="facultyId"
                    value={formData.facultyId}
                    onChange={handleChange}
                    placeholder="e.g. EMP-FAC-10"
                    className="w-full px-3 py-2 text-sm bg-surface rounded-md border border-border text-brandText-main focus:border-academic focus:ring-1 focus:ring-academic transition uppercase"
                  />
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-navy mb-1.5">
                  Department <span className="text-status-danger">*</span>
                </label>
                <select
                  name="department"
                  value={formData.department}
                  onChange={handleChange}
                  className="w-full px-3 py-2 text-sm bg-surface rounded-md border border-border text-brandText-main focus:border-academic focus:ring-1 focus:ring-academic transition"
                >
                  {DEPARTMENTS.map((dept) => (
                    <option key={dept} value={dept}>
                      {dept}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {role === 'student' && (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-navy mb-1.5">
                    Academic Year
                  </label>
                  <select
                    name="academicYear"
                    value={formData.academicYear}
                    onChange={handleChange}
                    className="w-full px-3 py-2 text-sm bg-surface rounded-md border border-border text-brandText-main focus:border-academic focus:ring-1 focus:ring-academic transition"
                  >
                    <option value="First Year">First Year</option>
                    <option value="Second Year">Second Year</option>
                    <option value="Third Year">Third Year</option>
                    <option value="Final Year">Final Year</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-navy mb-1.5">
                    Semester
                  </label>
                  <select
                    name="semester"
                    value={formData.semester}
                    onChange={handleChange}
                    className="w-full px-3 py-2 text-sm bg-surface rounded-md border border-border text-brandText-main focus:border-academic focus:ring-1 focus:ring-academic transition"
                  >
                    {[1, 2, 3, 4, 5, 6, 7, 8].map((s) => (
                      <option key={s} value={s}>
                        Semester {s}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-navy mb-1.5">
                    Division
                  </label>
                  <select
                    name="division"
                    value={formData.division}
                    onChange={handleChange}
                    className="w-full px-3 py-2 text-sm bg-surface rounded-md border border-border text-brandText-main focus:border-academic focus:ring-1 focus:ring-academic transition"
                  >
                    {['A', 'B', 'C', 'D'].map((d) => (
                      <option key={d} value={d}>
                        Division {d}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-navy mb-1.5">
                  Password (min 6 chars) <span className="text-status-danger">*</span>
                </label>
                <input
                  type="password"
                  required
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="••••••••"
                  className="w-full px-3 py-2 text-sm bg-surface rounded-md border border-border text-brandText-main focus:border-academic focus:ring-1 focus:ring-academic transition"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-navy mb-1.5">
                  Confirm Password <span className="text-status-danger">*</span>
                </label>
                <input
                  type="password"
                  required
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  placeholder="••••••••"
                  className="w-full px-3 py-2 text-sm bg-surface rounded-md border border-border text-brandText-main focus:border-academic focus:ring-1 focus:ring-academic transition"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full mt-4 flex items-center justify-center gap-2 py-2.5 px-4 rounded-md text-sm font-semibold text-white bg-academic hover:bg-academic-dark shadow-xs transition disabled:opacity-50"
            >
              <UserPlus className="w-4 h-4" />
              <span>{submitting ? 'Creating Account...' : `Register as ${role === 'student' ? 'Student' : 'Faculty'}`}</span>
            </button>
          </form>

          <p className="mt-4 text-center text-xs text-brandText-secondary">
            Note: HOD accounts are managed by system administrators.
          </p>
        </div>
      </div>
    </div>
  );
};
