'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';


export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error || 'Login failed');
        return;
      }

      router.push('/dashboard');
      router.refresh();
    } catch {
      setError('Network error');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-slate-700 px-4" data-testid="login-page">
      <div className="w-full max-w-sm space-y-6">
        {/* Logo */}
        <div className="text-center">
          <img
            src="/carved-rock-logo-white.png"
            alt="CarvedRock Fitness"
            width={200}
            height={80}
            className="mx-auto mb-2"
            data-testid="login-logo"
          />
          <p className="text-sm text-slate-400" data-testid="login-subtitle">Meal Tracker</p>
        </div>

        {/* Form card */}
        <div className="bg-white rounded-2xl shadow-lg p-6">
          <form onSubmit={handleSubmit} className="space-y-4" data-testid="login-form">
            {error && (
              <div className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-xl p-3 text-center" data-testid="login-error">
                {error}
              </div>
            )}

            {/* Flaw 8: Missing <label> element for email input */}
            <div>
              <input
                type="email"
                placeholder="Email address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                data-testid="login-email"
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent"
              />
            </div>

            <div>
              <label htmlFor="password" className="sr-only">Password</label>
              <input
                id="password"
                type="password"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                data-testid="login-password"
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              data-testid="login-submit"
              className="w-full py-3 bg-amber-500 text-white rounded-xl text-sm font-semibold hover:bg-amber-600 disabled:opacity-50 transition-colors"
            >
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>
        </div>

        {/* Demo accounts */}
        <div className="bg-white/10 rounded-2xl p-4 space-y-2" data-testid="demo-accounts">
          <p className="text-xs font-medium text-slate-400 text-center">Demo Accounts</p>
          {[
            { email: 'alice@carvedrock.com', desc: 'Alice · 2000 kcal · No allergies' },
            { email: 'bob@carvedrock.com', desc: 'Bob · 1800 kcal · Gluten, Dairy' },
            { email: 'carol@carvedrock.com', desc: 'Carol · 2500 kcal · Nuts' },
          ].map((account) => (
            <button
              key={account.email}
              onClick={() => { setEmail(account.email); setPassword('password123'); }}
              data-testid={`demo-account-${account.email.split('@')[0]}`}
              className="w-full text-left px-3 py-2 rounded-lg hover:bg-white/10 text-xs text-slate-300 transition-colors"
            >
              <span className="font-medium text-white">{account.email}</span>
              <br />
              <span className="text-slate-400">{account.desc}</span>
            </button>
          ))}
          <p className="text-[10px] text-slate-500 text-center">Password: password123</p>
        </div>
      </div>
    </div>
  );
}
