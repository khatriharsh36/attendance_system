import React from 'react';
import { Clock, MapPin, User as UserIcon } from 'lucide-react';

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];

export const TimetableGrid = ({ slots = [], currentDay = '' }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
      {DAYS.map((day) => {
        const isToday = currentDay.toLowerCase() === day.toLowerCase();
        const daySlots = slots
          .filter((s) => s.day.toLowerCase() === day.toLowerCase())
          .sort((a, b) => a.startTime.localeCompare(b.startTime));

        return (
          <div
            key={day}
            className={`rounded-card border flex flex-col transition ${
              isToday
                ? 'bg-surface border-academic shadow-md ring-1 ring-academic/20'
                : 'bg-surface border-border'
            }`}
          >
            {/* Day Header */}
            <div
              className={`p-3 border-b text-center rounded-t-card ${
                isToday
                  ? 'bg-academic text-white font-semibold'
                  : 'bg-surface-subtle text-navy font-medium border-border'
              }`}
            >
              <div className="text-sm">{day}</div>
              {isToday && <span className="text-[10px] tracking-wider uppercase opacity-90">Today</span>}
            </div>

            {/* Slots List */}
            <div className="p-3 flex-1 space-y-2.5">
              {daySlots.length > 0 ? (
                daySlots.map((slot) => (
                  <div
                    key={slot._id}
                    className="p-2.5 rounded-md border border-border bg-surface-muted/50 hover:bg-surface-muted transition text-xs space-y-1.5"
                  >
                    <div className="flex items-center justify-between gap-1 text-[11px] font-mono font-semibold text-academic">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3 text-brandText-muted" />
                        {slot.startTime} - {slot.endTime}
                      </span>
                      <span className="px-1.5 py-0.2 rounded bg-surface border border-border text-[10px]">
                        {slot.courseId?.type === 'practical' ? 'PRAC' : 'TH'}
                      </span>
                    </div>

                    <div className="font-semibold text-navy leading-snug">
                      {slot.courseId?.code}: {slot.courseId?.name}
                    </div>

                    <div className="flex items-center justify-between text-[11px] text-brandText-secondary pt-1 border-t border-border/40">
                      <span className="flex items-center gap-1">
                        <MapPin className="w-3 h-3 text-brandText-muted" />
                        {slot.room}
                      </span>
                      {slot.batch && <span className="font-medium text-navy">Batch {slot.batch}</span>}
                    </div>

                    {slot.facultyId && (
                      <div className="flex items-center gap-1 text-[11px] text-brandText-secondary truncate">
                        <UserIcon className="w-3 h-3 text-brandText-muted shrink-0" />
                        <span className="truncate">{slot.facultyId.name}</span>
                      </div>
                    )}
                  </div>
                ))
              ) : (
                <div className="h-28 flex items-center justify-center text-xs text-brandText-muted italic">
                  No classes scheduled
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};
