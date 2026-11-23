import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { PageHeader } from '../../components/PageHeader';
import { TimetableGrid } from '../../components/TimetableGrid';
import { LoadingSkeleton } from '../../components/LoadingSkeleton';
import { Calendar, Clock, MapPin, BookOpen } from 'lucide-react';

export const StudentTimetable = () => {
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTimetable = async () => {
      try {
        const res = await api.get('/students/me/timetable');
        setData(res.data);
      } catch (err) {
        console.error('Failed to load timetable:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchTimetable();
  }, []);

  if (loading) {
    return (
      <div>
        <div className="h-8 bg-surface-subtle rounded w-1/4 mb-6 animate-pulse" />
        <LoadingSkeleton count={3} />
      </div>
    );
  }

  const slots = data?.timetable || [];
  const currentDay = data?.currentDay || '';
  const todaySlots = data?.todaySlots || [];

  return (
    <div className="space-y-6">
      <PageHeader
        title="My Weekly Academic Timetable"
        subtitle={`Semester ${user?.semester} • Division ${user?.division} schedule • Current Day: ${currentDay}`}
      />

      {/* Today's Schedule Highlight Strip */}
      <div className="p-4 rounded-card bg-surface border border-academic/40 shadow-sm">
        <div className="flex items-center justify-between pb-2 border-b border-border mb-3">
          <div className="flex items-center gap-2 text-sm font-bold text-navy">
            <Clock className="w-4 h-4 text-academic" />
            <span>Today's Sessions ({currentDay})</span>
          </div>
          <span className="text-xs font-semibold px-2 py-0.5 rounded bg-academic-soft text-academic tabular-nums">
            {todaySlots.length} Classes Scheduled
          </span>
        </div>

        {todaySlots.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            {todaySlots.map((slot) => (
              <div
                key={slot._id}
                className="p-3 rounded-md border border-border bg-surface-muted/40 text-xs space-y-1"
              >
                <div className="flex items-center justify-between font-mono font-bold text-academic">
                  <span>{slot.startTime} - {slot.endTime}</span>
                  <span className="px-1.5 py-0.2 rounded bg-surface border text-[10px]">
                    {slot.courseId?.type === 'practical' ? 'LAB' : 'TH'}
                  </span>
                </div>
                <div className="font-semibold text-navy">
                  {slot.courseId?.code}: {slot.courseId?.name}
                </div>
                <div className="flex items-center justify-between text-brandText-secondary text-[11px] pt-1">
                  <span className="flex items-center gap-1">
                    <MapPin className="w-3 h-3 text-brandText-muted" />
                    {slot.room}
                  </span>
                  <span>{slot.facultyId?.name}</span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-xs text-brandText-secondary italic">No sessions scheduled for today.</p>
        )}
      </div>

      {/* Full 5-Day Weekly Timetable Grid */}
      <div>
        <h3 className="text-sm font-bold text-navy mb-3 flex items-center gap-2">
          <Calendar className="w-4 h-4 text-academic" />
          <span>Full Week Schedule</span>
        </h3>
        <TimetableGrid slots={slots} currentDay={currentDay} />
      </div>
    </div>
  );
};
