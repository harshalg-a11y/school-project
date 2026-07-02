'use client';

import { useEffect, useMemo, useState } from 'react';
import type { PeriodSchedule } from '@/types';

interface LiveTrackerProps {
  schedule: PeriodSchedule[];
}

interface ComputedPeriod {
  period: PeriodSchedule;
  start: Date;
  end: Date;
}

function parseTodayTime(time: string): Date {
  const [h, m] = time.split(':').map(Number);
  const now = new Date();
  const d = new Date(now);
  d.setHours(h, m, 0, 0);
  return d;
}

function formatDuration(ms: number): string {
  const totalSeconds = Math.max(0, Math.floor(ms / 1000));
  const min = Math.floor(totalSeconds / 60);
  const sec = totalSeconds % 60;
  return `${String(min).padStart(2, '0')}:${String(sec).padStart(2, '0')}`;
}

export default function LiveTracker({ schedule }: LiveTrackerProps) {
  const [now, setNow] = useState<Date>(new Date());

  const computed = useMemo<ComputedPeriod[]>(
    () =>
      [...schedule]
        .sort((a, b) => a.periodNumber - b.periodNumber)
        .map((p) => ({
          period: p,
          start: parseTodayTime(p.startTime),
          end: parseTodayTime(p.endTime),
        })),
    [schedule]
  );

  const activeIndex = useMemo(
    () => computed.findIndex((p) => now >= p.start && now < p.end),
    [computed, now]
  );

  const nextPeriod = useMemo(() => {
    if (activeIndex >= 0) return computed[activeIndex + 1] ?? null;
    return computed.find((p) => p.start > now) ?? null;
  }, [computed, activeIndex, now]);

  const active = activeIndex >= 0 ? computed[activeIndex] : null;

  const progress = useMemo(() => {
    if (!active) return 0;
    const total = active.end.getTime() - active.start.getTime();
    const elapsed = now.getTime() - active.start.getTime();
    return Math.min(100, Math.max(0, (elapsed / total) * 100));
  }, [active, now]);

  const remaining = useMemo(() => {
    if (!active) return 0;
    return active.end.getTime() - now.getTime();
  }, [active, now]);

  useEffect(() => {
    const timer = window.setInterval(() => setNow(new Date()), 1000);
    return () => window.clearInterval(timer);
  }, []);

  return (
    <section className="w-full rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <h3 className="text-lg font-semibold text-slate-900">Live Classroom Activity</h3>
      <p className="mt-1 text-sm text-slate-500">Current system time: {now.toLocaleTimeString()}</p>

      <div className="mt-5 space-y-4">
        <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
          <p className="text-xs uppercase tracking-wide text-slate-500">Right Now</p>
          {active ? (
            <>
              <p className="mt-1 text-base font-semibold text-slate-900">
                Period {active.period.periodNumber}: {active.period.name}
              </p>
              <p className="mt-1 text-sm text-slate-600">
                {active.period.startTime} - {active.period.endTime}
              </p>
            </>
          ) : (
            <p className="mt-1 text-base font-semibold text-slate-900">
              No active class period at this moment.
            </p>
          )}
        </div>

        <div>
          <div className="mb-2 flex items-center justify-between text-sm">
            <span className="font-medium text-slate-700">Period Progress</span>
            <span className="text-slate-600">{active ? `${progress.toFixed(1)}%` : '0%'}</span>
          </div>
          <div className="h-2.5 w-full overflow-hidden rounded-full bg-slate-200">
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{
                width: `${progress}%`,
                backgroundColor: 'var(--primary-color, #2563eb)',
              }}
            />
          </div>
          <p className="mt-2 text-sm text-slate-600">
            {active ? `Time remaining: ${formatDuration(remaining)}` : 'Awaiting next period...'}
          </p>
        </div>

        <div className="rounded-lg border border-slate-200 p-4">
          <p className="text-xs uppercase tracking-wide text-slate-500">Coming Up Next</p>
          {nextPeriod ? (
            <p className="mt-1 text-sm font-medium text-slate-800">
              Period {nextPeriod.period.periodNumber}: {nextPeriod.period.name} ({nextPeriod.period.startTime})
            </p>
          ) : (
            <p className="mt-1 text-sm font-medium text-slate-800">No upcoming period for today.</p>
          )}
        </div>
      </div>
    </section>
  );
}
