import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../services/api';
import { PageHeader } from '../../components/PageHeader';
import { LoadingSkeleton } from '../../components/LoadingSkeleton';
import { BookOpen, Users, CheckSquare, FileText, History, ArrowRight } from 'lucide-react';

export const MyCourses = () => {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCourses = async () => {
      try {
        const res = await api.get('/faculty/me/courses');
        setCourses(res.data.courses || []);
      } catch (err) {
        console.error('Failed to load courses:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchCourses();
  }, []);

  if (loading) {
    return (
      <div>
        <div className="h-8 bg-surface-subtle rounded w-1/4 mb-6 animate-pulse" />
        <LoadingSkeleton count={3} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="My Assigned Courses"
        subtitle="Curriculum subjects officially assigned by the Department HOD for instruction and attendance tracking."
      />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {courses.map((course) => {
          const isTheory = course.type === 'theory';
          return (
            <div
              key={course._id}
              className="bg-surface rounded-card border border-border shadow-card p-5 flex flex-col justify-between hover:border-academic/50 transition"
            >
              <div>
                <div className="flex items-center justify-between gap-2 mb-2">
                  <span className="font-mono text-xs font-bold text-academic bg-academic-soft px-2 py-0.5 rounded border border-academic/20">
                    {course.code}
                  </span>
                  <span
                    className={`text-xs px-2 py-0.5 rounded-full font-medium border ${
                      isTheory
                        ? 'bg-blue-50 text-academic border-academic/30'
                        : 'bg-emerald-50 text-status-success border-status-success/30'
                    }`}
                  >
                    {isTheory ? 'Theory' : `Practical ${course.batch ? `(${course.batch})` : ''}`}
                  </span>
                </div>

                <h3 className="text-base font-semibold text-navy leading-snug line-clamp-2 mb-3">
                  {course.name}
                </h3>

                <div className="text-xs text-brandText-secondary space-y-1.5 mb-4 p-3 bg-surface-muted/50 rounded-md border border-border/60">
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-1.5">
                      <Users className="w-3.5 h-3.5 text-brandText-muted" />
                      Enrolled Students:
                    </span>
                    <strong className="text-navy tabular-nums">{course.studentCount}</strong>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-1.5">
                      <History className="w-3.5 h-3.5 text-brandText-muted" />
                      Sessions Conducted:
                    </span>
                    <strong className="text-navy tabular-nums">{course.sessionCount}</strong>
                  </div>
                  <div className="flex items-center justify-between pt-1 border-t border-border/40 text-[11px]">
                    <span>Division: {course.division} {course.batch ? `• Batch: ${course.batch}` : ''}</span>
                    <span>{course.credits} Credits</span>
                  </div>
                </div>
              </div>

              <div className="pt-3 border-t border-border flex items-center justify-between gap-2">
                <Link
                  to={`/faculty/attendance/history?courseId=${course._id}`}
                  className="px-2.5 py-1 text-xs font-semibold text-brandText-secondary hover:text-navy hover:bg-surface-subtle border border-border rounded transition"
                >
                  History
                </Link>
                <Link
                  to={`/faculty/reports?courseId=${course._id}`}
                  className="px-2.5 py-1 text-xs font-semibold text-brandText-secondary hover:text-navy hover:bg-surface-subtle border border-border rounded transition flex items-center gap-1"
                >
                  <FileText className="w-3 h-3 text-academic" />
                  <span>Report</span>
                </Link>
                <Link
                  to={`/faculty/attendance/mark?courseId=${course._id}`}
                  className="px-3 py-1 text-xs font-semibold text-white bg-academic hover:bg-academic-dark rounded transition shadow-xs flex items-center gap-1"
                >
                  <CheckSquare className="w-3 h-3" />
                  <span>Mark</span>
                </Link>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
