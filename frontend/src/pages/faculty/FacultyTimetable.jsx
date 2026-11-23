import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { PageHeader } from '../../components/PageHeader';
import { TimetableGrid } from '../../components/TimetableGrid';
import { LoadingSkeleton } from '../../components/LoadingSkeleton';
import { Calendar } from 'lucide-react';

export const FacultyTimetable = () => {
  const [timetable, setTimetable] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTimetable = async () => {
      try {
        const res = await api.get('/faculty/me/timetable');
        setTimetable(res.data.timetable || []);
      } catch (err) {
        console.error('Failed to load faculty timetable:', err);
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

  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const currentDay = days[new Date().getDay()];

  return (
    <div className="space-y-6">
      <PageHeader
        title="My Teaching Schedule & Timetable"
        subtitle={`Official department weekly classroom and lab slot assignments • Today: ${currentDay}`}
      />

      <TimetableGrid slots={timetable} currentDay={currentDay} />
    </div>
  );
};
