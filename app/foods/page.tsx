'use client';

import { Fragment, useEffect, useState } from 'react';
import Navbar from '@/app/components/Navbar';

interface Food {
  id: number;
  name: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  sugar: number;
  fiber: number;
  ingredients: string[];
  allergens: string[];
  category: string;
  isSystem: boolean;
  createdById: number | null;
}

const CATEGORIES = ['protein', 'grain', 'vegetable', 'fruit', 'dairy', 'snack', 'beverage', 'other'];
const ALLERGEN_OPTIONS = ['gluten', 'dairy', 'nuts', 'soy', 'eggs', 'shellfish', 'fish'];

const emptyForm = {
  name: '',
  calories: 0,
  protein: 0,
  carbs: 0,
  fat: 0,
  sugar: 0,
  fiber: 0,
  ingredients: '',
  allergens: [] as string[],
  category: 'other',
};

export default function FoodsPage() {
  const [foods, setFoods] = useState<Food[]>([]);
  const [currentUserId, setCurrentUserId] = useState<number | null>(null);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    loadFoods();
    fetch('/api/auth/me')
      .then((r) => r.json())
      .then((data) => setCurrentUserId(data?.user?.id ?? data?.id ?? null));
  }, []);

  async function loadFoods() {
    const res = await fetch('/api/foods');
    const data = await res.json();
    setFoods(Array.isArray(data) ? data : []);
  }

  function canEdit(food: Food) {
    return !food.isSystem && food.createdById === currentUserId;
  }

  function startEdit(food: Food) {
    setForm({
      name: food.name,
      calories: food.calories,
      protein: food.protein,
      carbs: food.carbs,
      fat: food.fat,
      sugar: food.sugar,
      fiber: food.fiber,
      ingredients: food.ingredients.join(', '),
      allergens: food.allergens,
      category: food.category,
    });
    setEditingId(food.id);
    setShowForm(true);
    setError('');
  }

  function startNew() {
    setForm(emptyForm);
    setEditingId(null);
    setShowForm(true);
    setError('');
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');

    const body = {
      ...form,
    };

    try {
      let res: Response;
      if (editingId) {
        res = await fetch(`/api/foods/${editingId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        });
      } else {
        res = await fetch('/api/foods', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        });
      }

      if (!res.ok) {
        const data = await res.json();
        setError(data.error || 'Save failed');
        return;
      }

      setShowForm(false);
      setEditingId(null);
      setForm(emptyForm);
      loadFoods();
    } catch {
      setError('Network error');
    }
  }

  async function handleDelete(id: number) {
    if (!confirm('Delete this food?')) return;
    const res = await fetch(`/api/foods/${id}`, { method: 'DELETE' });
    if (res.ok) {
      loadFoods();
    } else {
      const data = await res.json();
      alert(data.error || 'Delete failed');
    }
  }

  const filtered = foods.filter((f) => {
    const matchesSearch = f.name.toLowerCase().includes(search.toLowerCase());
    const matchesCategory = categoryFilter === 'all' || f.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="min-h-screen bg-slate-50 pb-20" data-testid="foods-page">
      <Navbar />
      <main className="max-w-2xl mx-auto px-4 py-4 space-y-4">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-bold text-slate-800" data-testid="foods-title">Food Database</h1>
          <button
            onClick={startNew}
            data-testid="add-food-btn"
            className="px-4 py-2 bg-amber-500 text-white rounded-xl text-sm font-semibold hover:bg-amber-600"
          >
            + Add Food
          </button>
        </div>

        {/* Filters */}
        <div className="flex gap-3">
          <input
            type="text"
            placeholder="Search foods..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            data-testid="foods-search"
            className="flex-1 px-3 py-2 border border-slate-300 rounded-lg text-sm"
          />
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            data-testid="foods-category-filter"
            className="px-3 py-2 pr-8 border border-slate-300 rounded-lg text-sm appearance-none bg-[url('data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2216%22%20height%3D%2216%22%20viewBox%3D%220%200%2024%2024%22%20fill%3D%22none%22%20stroke%3D%22%2394a3b8%22%20stroke-width%3D%222%22%3E%3Cpath%20d%3D%22M6%209l6%206%206-6%22%2F%3E%3C%2Fsvg%3E')] bg-[length:16px] bg-[right_8px_center] bg-no-repeat"
          >
            <option value="all">All Categories</option>
            {CATEGORIES.map((c) => (
              <option key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</option>
            ))}
          </select>
        </div>

        {/* Add/Edit Form */}
        {showForm && (
          <div className="bg-white rounded-xl border border-slate-200 p-6" data-testid="food-form">
            <h2 className="text-lg font-semibold mb-4">
              {editingId ? 'Edit Food' : 'Add New Food'}
            </h2>
            {error && (
              <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg p-2 mb-4">
                {error}
              </div>
            )}
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="col-span-2">
                  <label className="block text-xs text-slate-500 mb-1">Name</label>
                  <input
                    type="text"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    required
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs text-slate-500 mb-1">Category</label>
                  <select
                    value={form.category}
                    onChange={(e) => setForm({ ...form, category: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
                  >
                    {CATEGORIES.map((c) => (
                      <option key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-slate-500 mb-1">Calories (per 100g)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={form.calories}
                    onChange={(e) => setForm({ ...form, calories: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs text-slate-500 mb-1">Protein (g)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={form.protein}
                    onChange={(e) => setForm({ ...form, protein: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs text-slate-500 mb-1">Carbs (g)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={form.carbs}
                    onChange={(e) => setForm({ ...form, carbs: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs text-slate-500 mb-1">Fat (g)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={form.fat}
                    onChange={(e) => setForm({ ...form, fat: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs text-slate-500 mb-1">Sugar (g)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={form.sugar}
                    onChange={(e) => setForm({ ...form, sugar: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs text-slate-500 mb-1">Fiber (g)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={form.fiber}
                    onChange={(e) => setForm({ ...form, fiber: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs text-slate-500 mb-1">Ingredients</label>
                <input
                  type="text"
                  value={form.ingredients}
                  onChange={(e) => setForm({ ...form, ingredients: e.target.value })}
                  placeholder="Comma-separated ingredients"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
                />
              </div>
              <div>
                <label className="block text-xs text-slate-500 mb-1">Allergens</label>
                <div className="flex flex-wrap gap-2">
                  {ALLERGEN_OPTIONS.map((a) => (
                    <label key={a} className="flex items-center gap-1 text-sm">
                      <input
                        type="checkbox"
                        checked={form.allergens.includes(a)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setForm({ ...form, allergens: [...form.allergens, a] });
                          } else {
                            setForm({ ...form, allergens: form.allergens.filter((x) => x !== a) });
                          }
                        }}
                      />
                      {a}
                    </label>
                  ))}
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  type="submit"
                  className="px-4 py-2 bg-amber-500 text-white rounded-lg text-sm hover:bg-amber-600"
                >
                  {editingId ? 'Save Changes' : 'Add Food'}
                </button>
                <button
                  type="button"
                  onClick={() => { setShowForm(false); setEditingId(null); }}
                  className="px-4 py-2 border border-slate-300 rounded-lg text-sm hover:bg-slate-50"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Food Table — Flaw 9: Weight column always shows grams, doesn't respect unit preference */}
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm" data-testid="foods-table">
              <thead className="bg-slate-50 text-slate-500 text-xs">
                <tr>
                  <th className="text-left px-4 py-3">Name</th>
                  <th className="text-left px-4 py-3">Category</th>
                  <th className="text-right px-4 py-3">Cal</th>
                  <th className="text-right px-4 py-3">Protein</th>
                  <th className="text-right px-4 py-3">Carbs</th>
                  <th className="text-right px-4 py-3">Fat</th>
                  <th className="text-left px-4 py-3">Allergens</th>
                  <th className="text-left px-4 py-3">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((food) => {
                  const allergens = food.allergens;
                  const isExpanded = expandedId === food.id;
                  return (
                    <Fragment key={food.id}>
                      <tr
                        key={food.id}
                        onClick={() => setExpandedId(isExpanded ? null : food.id)}
                        data-testid={`food-row-${food.id}`}
                        className="border-t border-slate-100 hover:bg-stone-50 cursor-pointer"
                      >
                        <td className="px-4 py-2 font-medium">{food.name}</td>
                        <td className="px-4 py-2 text-slate-500 capitalize">{food.category}</td>
                        <td className="px-4 py-2 text-right">{food.calories}</td>
                        <td className="px-4 py-2 text-right">{food.protein}g</td>
                        <td className="px-4 py-2 text-right">{food.carbs}g</td>
                        <td className="px-4 py-2 text-right">{food.fat}g</td>
                        <td className="px-4 py-2">
                          {allergens.length > 0 ? (
                            <div className="flex flex-wrap gap-1">
                              {allergens.map((a) => (
                                <span
                                  key={a}
                                  className="px-1.5 py-0.5 bg-amber-100 text-amber-700 rounded text-xs"
                                >
                                  {a}
                                </span>
                              ))}
                            </div>
                          ) : (
                            <span className="text-slate-300">—</span>
                          )}
                        </td>
                        <td className="px-4 py-2">
                          {canEdit(food) ? (
                            <div className="flex gap-2">
                              <button
                                onClick={(e) => { e.stopPropagation(); startEdit(food); }}
                                className="text-emerald-700 hover:text-emerald-900 text-xs"
                              >
                                Edit
                              </button>
                              <button
                                onClick={(e) => { e.stopPropagation(); handleDelete(food.id); }}
                                className="text-red-500 hover:text-red-700 text-xs"
                              >
                                Delete
                              </button>
                            </div>
                          ) : (
                            <span className="text-slate-300 text-xs">
                              {food.isSystem ? 'System' : '—'}
                            </span>
                          )}
                        </td>
                      </tr>
                      {isExpanded && (
                        <tr key={`${food.id}-detail`} className="bg-slate-50" data-testid={`food-detail-${food.id}`}>
                          <td colSpan={8} className="px-4 py-3">
                            <div className="grid grid-cols-4 sm:grid-cols-8 gap-3 text-sm">
                              <div>
                                <div className="text-[10px] text-slate-400 uppercase">Calories</div>
                                <div className="font-medium">{food.calories}</div>
                              </div>
                              <div>
                                <div className="text-[10px] text-slate-400 uppercase">Protein</div>
                                <div className="font-medium">{food.protein}g</div>
                              </div>
                              <div>
                                <div className="text-[10px] text-slate-400 uppercase">Carbs</div>
                                <div className="font-medium">{food.carbs}g</div>
                              </div>
                              <div>
                                <div className="text-[10px] text-slate-400 uppercase">Fat</div>
                                <div className="font-medium">{food.fat}g</div>
                              </div>
                              <div>
                                <div className="text-[10px] text-slate-400 uppercase">Sugar</div>
                                <div className="font-medium">{food.sugar}g</div>
                              </div>
                              <div>
                                <div className="text-[10px] text-slate-400 uppercase">Fiber</div>
                                <div className="font-medium">{food.fiber}g</div>
                              </div>
                              {food.ingredients.length > 0 && (
                                <div className="col-span-2">
                                  <div className="text-[10px] text-slate-400 uppercase">Ingredients</div>
                                  <div className="font-medium">{food.ingredients.join(', ')}</div>
                                </div>
                              )}
                            </div>
                          </td>
                        </tr>
                      )}
                    </Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
          <div className="px-4 py-2 text-xs text-slate-400 bg-slate-50">
            {filtered.length} food{filtered.length !== 1 ? 's' : ''} • Values per 100g
          </div>
        </div>
      </main>
    </div>
  );
}
