'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Navbar from '@/app/components/Navbar';
import AppAlert from '@/app/components/AppAlert';

interface Preferences {
  calorieTarget: number;
  allergies: string[];
}

const ALLERGEN_OPTIONS = [
  'gluten',
  'dairy',
  'nuts',
  'soy',
  'eggs',
  'shellfish',
  'fish',
];

const emptyPreferences: Preferences = {
  calorieTarget: 2000,
  allergies: [],
};

function formatAllergen(allergen: string) {
  return allergen.charAt(0).toUpperCase() + allergen.slice(1);
}

export default function SettingsPage() {
  const [preferences, setPreferences] = useState<Preferences>(emptyPreferences);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  useEffect(() => {
    fetch('/api/user/preferences')
      .then(async (res) => {
        if (!res.ok) throw new Error('Could not load settings');
        return res.json();
      })
      .then((data) => {
        const loaded = data.preferences ?? emptyPreferences;
        setPreferences({
          calorieTarget: loaded.calorieTarget ?? emptyPreferences.calorieTarget,
          allergies: Array.isArray(loaded.allergies) ? loaded.allergies : [],
        });
      })
      .catch(() => setError('Could not load settings.'))
      .finally(() => setLoading(false));
  }, []);

  function toggleAllergen(allergen: string) {
    setMessage('');
    setError('');
    setPreferences((current) => {
      const selected = current.allergies.includes(allergen);
      return {
        ...current,
        allergies: selected
          ? current.allergies.filter((item) => item !== allergen)
          : [...current.allergies, allergen],
      };
    });
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setSaving(true);
    setError('');
    setMessage('');

    const calorieTarget = Math.trunc(Number(preferences.calorieTarget));
    if (!Number.isInteger(calorieTarget) || calorieTarget <= 0) {
      setError('Enter a positive whole-number calorie goal.');
      setSaving(false);
      return;
    }

    try {
      const res = await fetch('/api/user/preferences', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          calorieTarget,
          allergies: preferences.allergies,
        }),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Settings could not be saved.');
        return;
      }

      setPreferences({
        calorieTarget: data.preferences.calorieTarget,
        allergies: data.preferences.allergies,
      });
      setMessage('Settings saved.');
    } catch {
      setError('Network error while saving settings.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 pb-20" data-testid="settings-page">
      <Navbar />
      <main className="max-w-2xl mx-auto px-4 py-4 space-y-4">
        <div>
          <h1 className="text-xl font-bold text-slate-800" data-testid="settings-title">
            Settings
          </h1>
          <p className="text-sm text-slate-500">
            Set the calorie goal and allergy profile used across your meals.
          </p>
        </div>

        <AppAlert message={error} onDismiss={() => setError('')} />
        {message && (
          <div
            role="status"
            className="flex items-start justify-between gap-3 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700"
          >
            <span>{message}</span>
            <button
              type="button"
              onClick={() => setMessage('')}
              aria-label="Dismiss message"
              className="shrink-0 text-emerald-400 transition-colors hover:text-emerald-700"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M18 6L6 18M6 6l12 12" />
              </svg>
            </button>
          </div>
        )}

        {loading ? (
          <div className="text-center text-slate-400 py-8">Loading settings...</div>
        ) : (
          <form
            onSubmit={handleSubmit}
            className="space-y-4"
            data-testid="settings-form"
          >
            <section className="bg-white rounded-xl border border-slate-200 p-5 space-y-3">
              <div>
                <label
                  htmlFor="calorieTarget"
                  className="block text-sm font-semibold text-slate-800"
                >
                  Daily calorie goal
                </label>
                <p className="text-xs text-slate-400">
                  This target appears on your dashboard and daily summaries.
                </p>
              </div>
              <div className="flex items-center gap-3">
                <input
                  id="calorieTarget"
                  type="number"
                  min="1"
                  step="1"
                  required
                  inputMode="numeric"
                  value={preferences.calorieTarget}
                  onChange={(event) => {
                    setMessage('');
                    setError('');
                    setPreferences({
                      ...preferences,
                      calorieTarget: Number(event.target.value),
                    });
                  }}
                  data-testid="calorie-target-input"
                  className="w-36 px-3 py-2 border border-slate-300 rounded-lg text-sm"
                />
                <span className="text-sm text-slate-500">kcal per day</span>
              </div>
            </section>

            <section className="bg-white rounded-xl border border-slate-200 p-5 space-y-3">
              <div>
                <h2 className="text-sm font-semibold text-slate-800">
                  Allergens
                </h2>
                <p className="text-xs text-slate-400">
                  Foods with selected allergens are hidden from your food browser.
                </p>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {ALLERGEN_OPTIONS.map((allergen) => {
                  const selected = preferences.allergies.includes(allergen);
                  return (
                    <label
                      key={allergen}
                      className={`flex items-center gap-2 rounded-lg border px-3 py-2 text-sm transition-colors ${
                        selected
                          ? 'border-amber-300 bg-amber-50 text-amber-800'
                          : 'border-slate-200 bg-white text-slate-600'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={selected}
                        onChange={() => toggleAllergen(allergen)}
                        data-testid={`allergen-${allergen}`}
                        className="h-4 w-4 accent-amber-500"
                      />
                      <span>{formatAllergen(allergen)}</span>
                    </label>
                  );
                })}
              </div>
              {preferences.allergies.length > 0 ? (
                <p className="text-xs text-slate-400" data-testid="selected-allergens">
                  Selected: {preferences.allergies.map(formatAllergen).join(', ')}
                </p>
              ) : (
                <p className="text-xs text-slate-400" data-testid="selected-allergens">
                  No allergens selected.
                </p>
              )}
            </section>

            <div className="flex items-center justify-between gap-3">
              <Link
                href="/allergens"
                className="text-sm text-amber-600 font-medium hover:text-amber-700"
              >
                View allergen reference
              </Link>
              <button
                type="submit"
                disabled={saving}
                data-testid="save-settings-btn"
                className="px-4 py-2 bg-amber-500 text-white rounded-xl text-sm font-semibold hover:bg-amber-600 disabled:opacity-60"
              >
                {saving ? 'Saving...' : 'Save Settings'}
              </button>
            </div>
          </form>
        )}
      </main>
    </div>
  );
}
