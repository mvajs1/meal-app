'use client';

import { useEffect, useState } from 'react';
import Navbar from '@/app/components/Navbar';

interface AllergenGroup {
  allergen: string;
  foods: { id: number; name: string }[];
}

export default function AllergensPage() {
  const [allergens, setAllergens] = useState<AllergenGroup[]>([]);

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/allergens')
      .then((r) => r.json())
      .then((data) => setAllergens(Array.isArray(data) ? data : Array.isArray(data?.allergens) ? data.allergens : []))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="min-h-screen bg-slate-50 pb-20" data-testid="allergens-page">
      <Navbar />
      <main className="max-w-2xl mx-auto px-4 py-4 space-y-4">
        <h1 className="text-xl font-bold text-slate-800" data-testid="allergens-title">Allergen Reference</h1>
        <p className="text-sm text-slate-500">
          This page lists all allergen categories and the foods that contain each allergen.
          Foods matching your allergy profile are automatically filtered out when browsing
          and planning meals.
        </p>

        <div className="grid gap-4 sm:grid-cols-2" data-testid="allergens-grid">
          {allergens.map((group) => (
            <div
              key={group.allergen}
              data-testid={`allergen-group-${group.allergen}`}
              className="bg-white rounded-xl border border-slate-200 p-4"
            >
              <h2 className="font-semibold text-sm text-slate-800 capitalize mb-2">
                {group.allergen}
              </h2>
              <div className="space-y-1">
                {group.foods.map((food) => (
                  <div
                    key={food.id}
                    className="text-sm text-slate-600 flex items-center gap-2"
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                    {food.name}
                  </div>
                ))}
              </div>
              <div className="mt-2 text-xs text-slate-400">
                {group.foods.length} food{group.foods.length !== 1 ? 's' : ''}
              </div>
            </div>
          ))}
        </div>

        {loading && allergens.length === 0 && (
          <div className="text-center text-slate-400 py-8">Loading allergens...</div>
        )}
        {!loading && allergens.length === 0 && (
          <div className="text-center text-slate-400 py-8">No allergens found.</div>
        )}
      </main>
    </div>
  );
}
