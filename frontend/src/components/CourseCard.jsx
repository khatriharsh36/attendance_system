import React from 'react';
import { BookOpen, Users, Calendar, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';

export const CourseCard = ({
  course,
  stats = null,
  actionLink = null,
  actionText = 'View Details',
}) => {
  const isTheory = course.type === 'theory';

  return (
    <div className="bg-surface rounded-card border border-border shadow-card p-5 flex flex-col justify-between hover:border-academic/50 transition">
      <div>
        <div className="flex items-start justify-between gap-2 mb-2">
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

        <h3 className="text-base font-semibold text-navy leading-snug line-clamp-2 mb-2">
          {course.name}
        </h3>

        <div className="text-xs text-brandText-secondary space-y-1 mb-4">
          <div className="flex items-center gap-1.5">
            <Users className="w-3.5 h-3.5 text-brandText-muted" />
            <span>Division {course.division} {course.batch ? `• Batch ${course.batch}` : ''}</span>
          </div>
          {course.facultyId && (
            <div className="flex items-center gap-1.5">
              <BookOpen className="w-3.5 h-3.5 text-brandText-muted" />
              <span>{typeof course.facultyId === 'object' ? course.facultyId.name : 'Assigned Faculty'}</span>
            </div>
          )}
        </div>
      </div>

      <div className="pt-3 border-t border-border flex items-center justify-between mt-auto">
        {stats ? (
          <div className="text-xs">
            <span className="text-brandText-muted">Attendance: </span>
            <strong className="text-navy tabular-nums font-semibold">{stats}</strong>
          </div>
        ) : (
          <div className="text-xs text-brandText-muted">
            {course.credits} Credits
          </div>
        )}

        {actionLink && (
          <Link
            to={actionLink}
            className="inline-flex items-center gap-1 text-xs font-semibold text-academic hover:text-academic-dark transition"
          >
            {actionText}
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        )}
      </div>
    </div>
  );
};
