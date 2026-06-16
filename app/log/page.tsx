import { Suspense } from 'react';
import LogContent from './LogContent';

export default function LogPage() {
  return (
    <Suspense fallback={<LogLoading />}>
      <LogContent />
    </Suspense>
  );
}

function LogLoading() {
  return (
    <div className="min-h-screen bg-slate-50">
      <div className="p-8 text-center text-slate-300">Loading...</div>
    </div>
  );
}
