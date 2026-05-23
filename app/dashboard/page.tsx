'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Navbar from '@/app/components/Navbar';
import MacroChart from '@/app/components/MacroChart';
import Link from 'next/link';

interface FoodLogEntry {
  id: number;
  grams: number;
  mealType: string;
  food: {
    id: number;
    name: string;
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
  };
}

interface DaySummary {
  macros: {
    totalCalories: number;
    totalProtein: number;
    totalCarbs: number;
    totalFat: number;
    proteinPercent: number;
    carbsPercent: number;
    fatPercent: number;
  };
  balanced: { isBalanced: boolean };
  calorieCheck: { withinTarget: boolean };
  feedback: string;
  logs: FoodLogEntry[];
}

interface User {
  id: number;
  name: string;
  calorieTarget: number;
  goal: string;
}

const MEAL_TYPES = ['breakfast', 'lunch', 'dinner', 'snack'] as const;
const MEAL_LABELS: Record<string, string> = {
  breakfast: 'Breakfast',
  lunch: 'Lunch',
  dinner: 'Dinner',
  snack: 'Snack',
};

export default function DashboardPage() {
  const searchParams = useSearchParams();
  const [user, setUser] = useState<User | null>(null);
  const [summary, setSummary] = useState<DaySummary | null>(null);
  const [loading, setLoading] = useState(true);

  const today = new Date().toISOString().split('T')[0];
  const date = searchParams.get('date') || today;
  const isToday = date === today;

  useEffect(() => {
    Promise.all([
      fetch('/api/auth/me').then((r) => r.json()),
      fetch(`/api/food-log?date=${date}`).then((r) => r.json()),
    ])
      .then(([userData, summaryData]) => {
        const u = userData.user ?? userData;
        setUser(u);
        setSummary(summaryData);
      })
      .finally(() => setLoading(false));
  }, [date]);

  async function handleDelete(logId: number) {
    const res = await fetch(`/api/food-log/${logId}`, { method: 'DELETE' });
    if (res.ok) {
      const updated = await fetch(`/api/food-log?date=${date}`).then((r) => r.json());
      setSummary(updated);
    }
  }

  async function handleClearToday() {
    if (!confirm('Clear all food logs for this day?')) return;
    const res = await fetch(`/api/food-log?date=${date}`, { method: 'DELETE' });
    if (res.ok) {
      const updated = await fetch(`/api/food-log?date=${date}`).then((r) => r.json());
      setSummary(updated);
    }
  }

  if (loading || !user) {
    return (
      <div className="min-h-screen bg-slate-50">
        <div className="p-8 text-center text-slate-300">Loading...</div>
      </div>
    );
  }

  const macros = summary?.macros;
  const logs = summary?.logs ?? [];
  const logsByMeal: Record<string, FoodLogEntry[]> = {};
  for (const type of MEAL_TYPES) logsByMeal[type] = [];
  for (const log of logs) {
    if (logsByMeal[log.mealType]) logsByMeal[log.mealType].push(log);
    else logsByMeal['snack'].push(log);
  }

  return (
    <div className="min-h-screen bg-slate-50 pb-20" data-testid="dashboard-page">
      <Navbar />
      <main className="max-w-2xl mx-auto px-4 py-4 space-y-4">
        {/* Date Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-slate-800" data-testid="dashboard-title">
              {isToday ? 'Today' : new Date(date + 'T12:00:00').toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' })}
            </h1>
            <p className="text-sm text-slate-400" data-testid="dashboard-date">
              {isToday
                ? new Date().toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' })
                : date}
            </p>
          </div>
          <div className="flex items-center gap-3">
            {logs.length > 0 && (
              <button
                onClick={handleClearToday}
                className="text-xs text-red-400 hover:text-red-600 font-medium"
                data-testid="clear-today-btn"
              >
                Clear Today
              </button>
            )}
            <Link
              href="/history"
              className="text-xs text-amber-600 font-medium hover:text-amber-700"
              data-testid="view-history-link"
            >
              View History
            </Link>
          </div>
        </div>

        {/* Calorie Summary */}
        <div className="bg-slate-700 rounded-2xl p-5 text-white" data-testid="calorie-summary">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-slate-300 text-sm">Calories</p>
              <p className="text-3xl font-bold" data-testid="calories-consumed">
                {Math.round(macros?.totalCalories ?? 0)}
                <span className="text-lg text-slate-400 font-normal"> / {user.calorieTarget}</span>
              </p>
            </div>
            <div className="text-right">
              <p className="text-slate-300 text-sm">Remaining</p>
              <p className="text-2xl font-bold text-amber-400" data-testid="calories-remaining">
                {Math.max(0, user.calorieTarget - Math.round(macros?.totalCalories ?? 0))}
              </p>
            </div>
          </div>
          <div className="mt-3 h-2 bg-white/20 rounded-full overflow-hidden" data-testid="calorie-progress">
            <div
              className="h-full bg-amber-400 rounded-full transition-all duration-300"
              style={{
                width: `${Math.min(100, ((macros?.totalCalories ?? 0) / user.calorieTarget) * 100)}%`,
              }}
            />
          </div>
        </div>

        {/* Macros */}
        <div className="bg-white rounded-2xl border border-slate-100 p-5" data-testid="macros-card">
          <h2 className="font-semibold text-slate-800 mb-2">Macros</h2>
          <MacroChart
            proteinPercent={macros?.proteinPercent ?? 0}
            carbsPercent={macros?.carbsPercent ?? 0}
            fatPercent={macros?.fatPercent ?? 0}
            totalProtein={macros?.totalProtein ?? 0}
            totalCarbs={macros?.totalCarbs ?? 0}
            totalFat={macros?.totalFat ?? 0}
          />
        </div>

        {/* Feedback */}
        {summary?.feedback && logs.length > 0 && (
          <div
            data-testid="daily-feedback"
            className={`rounded-2xl px-5 py-4 text-sm font-medium ${
              summary.balanced.isBalanced && summary.calorieCheck.withinTarget
                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                : summary.balanced.isBalanced || summary.calorieCheck.withinTarget
                  ? 'bg-amber-50 text-amber-700 border border-amber-200'
                  : 'bg-slate-100 text-slate-600 border border-slate-200'
            }`}
          >
            {summary.feedback}
          </div>
        )}

        {/* Meals */}
        {MEAL_TYPES.map((type) => {
          const entries = logsByMeal[type];
          const mealCals = entries.reduce(
            (sum, e) => sum + (e.food.calories * e.grams) / 100,
            0
          );

          return (
            <div key={type} className="bg-white rounded-2xl border border-slate-100 p-5" data-testid={`meal-section-${type}`}>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <h2 className="font-semibold text-slate-800">{MEAL_LABELS[type]}</h2>
                  {entries.length > 0 && (
                    <span className="text-xs text-slate-400">
                      {Math.round(mealCals)} kcal
                    </span>
                  )}
                </div>
                <Link
                  href={`/log?mealType=${type}&date=${date}`}
                  data-testid={`add-food-${type}`}
                  className="w-8 h-8 flex items-center justify-center rounded-full bg-amber-50 text-amber-600 hover:bg-amber-100"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M12 5v14M5 12h14" />
                  </svg>
                </Link>
              </div>

              {entries.length === 0 ? (
                <p className="text-sm text-slate-300 text-center py-2">
                  No foods logged
                </p>
              ) : (
                <div className="space-y-2">
                  {entries.map((entry) => (
                    <div key={entry.id} className="flex items-center justify-between py-1" data-testid={`food-entry-${entry.id}`}>
                      <div>
                        <span className="text-sm text-slate-700">{entry.food.name}</span>
                        <span className="text-xs text-slate-400 ml-2">{entry.grams}g</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-xs text-slate-500">
                          {Math.round((entry.food.calories * entry.grams) / 100)} kcal
                        </span>
                        <button
                          onClick={() => handleDelete(entry.id)}
                          data-testid={`delete-entry-${entry.id}`}
                          className="text-slate-300 hover:text-red-400 transition-colors"
                        >
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M18 6L6 18M6 6l12 12" />
                          </svg>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </main>
    </div>
  );
}
