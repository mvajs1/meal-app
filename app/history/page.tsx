'use client';

import { useEffect, useState } from 'react';
import Navbar from '@/app/components/Navbar';
import Link from 'next/link';

interface DaySummary {
  date: string;
  macros: {
    totalCalories: number;
    totalProtein: number;
    totalCarbs: number;
    totalFat: number;
  };
  balanced: { isBalanced: boolean };
  calorieCheck: { withinTarget: boolean };
  feedback: string;
  entryCount: number;
}

export default function HistoryPage() {
  const [days, setDays] = useState<DaySummary[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const to = new Date().toISOString().split('T')[0];
    const from = new Date(Date.now() - 30 * 86400000).toISOString().split('T')[0];

    fetch(`/api/food-log/history?from=${from}&to=${to}`)
      .then((r) => r.json())
      .then((data) => setDays(Array.isArray(data) ? data : []))
      .finally(() => setLoading(false));
  }, []);

  function getStatusColor(day: DaySummary) {
    if (day.balanced.isBalanced && day.calorieCheck.withinTarget) return 'bg-emerald-50 border-emerald-200';
    if (day.balanced.isBalanced || day.calorieCheck.withinTarget) return 'bg-amber-50 border-amber-200';
    return 'bg-white border-slate-100';
  }

  function getStatusDot(day: DaySummary) {
    if (day.balanced.isBalanced && day.calorieCheck.withinTarget) return 'bg-emerald-400';
    if (day.balanced.isBalanced || day.calorieCheck.withinTarget) return 'bg-amber-400';
    return 'bg-slate-300';
  }

  function formatDate(dateStr: string) {
    const d = new Date(dateStr + 'T12:00:00');
    const today = new Date().toISOString().split('T')[0];
    const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];

    if (dateStr === today) return 'Today';
    if (dateStr === yesterday) return 'Yesterday';
    return d.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' });
  }

  return (
    <div className="min-h-screen bg-slate-50 pb-20" data-testid="history-page">
      <Navbar />
      <main className="max-w-2xl mx-auto px-4 py-4 space-y-4">
        <h1 className="text-xl font-bold text-slate-800" data-testid="history-title">History</h1>
        <p className="text-sm text-slate-400">Last 30 days</p>

        {loading && (
          <div className="text-center text-slate-400 py-8">Loading...</div>
        )}

        {!loading && days.length === 0 && (
          <div className="text-center text-slate-400 py-8">
            No food logged yet. Start by{' '}
            <Link href="/log" className="text-amber-600 underline">logging a meal</Link>.
          </div>
        )}

        <div className="space-y-2" data-testid="history-list">
          {days.map((day) => (
            <Link
              key={day.date}
              href={`/dashboard?date=${day.date}`}
              data-testid={`history-day-${day.date}`}
              className={`block rounded-2xl border p-4 transition-colors hover:border-amber-200 ${getStatusColor(day)}`}
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className={`w-2 h-2 rounded-full ${getStatusDot(day)}`} />
                  <span className="font-semibold text-sm text-slate-800">
                    {formatDate(day.date)}
                  </span>
                </div>
                <span className="text-sm font-bold text-slate-700">
                  {Math.round(day.macros.totalCalories)} kcal
                </span>
              </div>
              <div className="flex items-center gap-4 text-xs text-slate-500">
                <span>P {Math.round(day.macros.totalProtein)}g</span>
                <span>C {Math.round(day.macros.totalCarbs)}g</span>
                <span>F {Math.round(day.macros.totalFat)}g</span>
                <span className="text-slate-400">{day.entryCount} entries</span>
              </div>
              <p className="text-xs text-slate-500 mt-2" data-testid={`history-feedback-${day.date}`}>{day.feedback}</p>
            </Link>
          ))}
        </div>
      </main>
    </div>
  );
}
