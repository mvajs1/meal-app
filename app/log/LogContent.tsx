'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Navbar from '@/app/components/Navbar';

interface Food {
  id: number;
  name: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  category: string;
}

const MEAL_TYPES = ['breakfast', 'lunch', 'dinner', 'snack'];

export default function LogContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [foods, setFoods] = useState<Food[]>([]);
  const [search, setSearch] = useState('');
  const [mealType, setMealType] = useState(searchParams.get('mealType') || 'lunch');
  const [date, setDate] = useState(searchParams.get('date') || new Date().toISOString().split('T')[0]);
  const [selectedFood, setSelectedFood] = useState<Food | null>(null);
  const [grams, setGrams] = useState(100);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    fetch('/api/foods')
      .then((r) => r.json())
      .then((data) => setFoods(Array.isArray(data) ? data : []));
  }, []);

  const filtered = foods.filter((f) =>
    f.name.toLowerCase().includes(search.toLowerCase())
  );

  async function handleAdd() {
    if (!selectedFood) return;
    setSaving(true);
    setMessage('');

    const res = await fetch('/api/food-log', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        foodId: selectedFood.id,
        grams,
        mealType,
        date,
      }),
    });

    if (res.ok) {
      setMessage(`Added ${grams}g ${selectedFood.name}`);
      setSelectedFood(null);
      setGrams(100);
      setSearch('');
    } else {
      setMessage('Failed to add entry');
    }
    setSaving(false);
  }

  return (
    <div className="min-h-screen bg-slate-50 pb-20" data-testid="log-page">
      <Navbar />
      <main className="max-w-2xl mx-auto px-4 py-4 space-y-4">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-bold text-slate-800" data-testid="log-title">Log Food</h1>
          <button
            onClick={() => router.push('/dashboard')}
            data-testid="log-done-btn"
            className="text-sm text-slate-500 hover:text-slate-700"
          >
            Done
          </button>
        </div>

        {message && (
          <div className="text-sm bg-emerald-50 border border-emerald-200 rounded-lg p-3 text-emerald-700" data-testid="log-message">
            {message}
          </div>
        )}

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs text-slate-500 mb-1">Date</label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              data-testid="log-date-input"
              className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm bg-white"
            />
          </div>
          <div>
            <label className="block text-xs text-slate-500 mb-1">Meal</label>
            <div className="flex gap-1">
              {MEAL_TYPES.map((t) => (
                <button
                  key={t}
                  onClick={() => setMealType(t)}
                  data-testid={`meal-type-${t}`}
                  className={`flex-1 py-2 text-xs font-medium rounded-lg capitalize transition-colors ${
                    mealType === t
                      ? 'bg-amber-500 text-white'
                      : 'bg-white border border-slate-200 text-slate-600 hover:border-amber-200'
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>
        </div>

        {selectedFood && (
          <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4" data-testid="selected-food-card">
            <div className="flex items-center justify-between mb-3">
              <div>
                <div className="font-semibold text-slate-800">{selectedFood.name}</div>
                <div className="text-xs text-slate-500">
                  {Math.round((selectedFood.calories * grams) / 100)} kcal
                  &bull; P {((selectedFood.protein * grams) / 100).toFixed(1)}g
                  &bull; C {((selectedFood.carbs * grams) / 100).toFixed(1)}g
                  &bull; F {((selectedFood.fat * grams) / 100).toFixed(1)}g
                </div>
              </div>
              <button
                onClick={() => setSelectedFood(null)}
                className="text-slate-400 hover:text-slate-600"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M18 6L6 18M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="flex gap-2">
              <div className="flex-1">
                <label className="block text-xs text-slate-500 mb-1">Grams</label>
                <input
                  type="number"
                  value={grams || ''}
                  onChange={(e) => setGrams(e.target.value === '' ? 0 : Number(e.target.value))}
                  data-testid="grams-input"
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm"
                  min="1"
                />
              </div>
              <button
                onClick={handleAdd}
                disabled={saving || grams <= 0}
                data-testid="add-food-btn"
                className="self-end px-6 py-2 bg-amber-500 text-white rounded-lg text-sm font-semibold hover:bg-amber-600 disabled:opacity-50"
              >
                {saving ? 'Adding...' : 'Add'}
              </button>
            </div>
          </div>
        )}

        <div>
          <input
            type="text"
            placeholder="Search foods..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            data-testid="food-search-input"
            className="w-full px-4 py-3 border border-slate-200 rounded-xl text-sm bg-white"
          />
        </div>

        <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden divide-y divide-slate-50" data-testid="food-list">
          {filtered.slice(0, 20).map((food) => (
            <button
              key={food.id}
              onClick={() => { setSelectedFood(food); setGrams(100); }}
              data-testid={`food-item-${food.id}`}
              className={`w-full flex items-center justify-between px-4 py-3 hover:bg-slate-50 transition-colors text-left ${
                selectedFood?.id === food.id ? 'bg-amber-50' : ''
              }`}
            >
              <div>
                <div className="text-sm font-medium text-slate-700">{food.name}</div>
                <div className="text-xs text-slate-400 capitalize">{food.category}</div>
              </div>
              <div className="text-right">
                <div className="text-sm text-slate-600">{food.calories} kcal</div>
                <div className="text-[10px] text-slate-400">per 100g</div>
              </div>
            </button>
          ))}
          {filtered.length === 0 && (
            <div className="text-center text-slate-400 py-6 text-sm">
              No foods found
            </div>
          )}
          {filtered.length > 20 && (
            <div className="text-center text-slate-400 py-2 text-xs">
              Showing first 20 results. Type to narrow search.
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
