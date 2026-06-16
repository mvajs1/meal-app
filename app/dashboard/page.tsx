import { Suspense } from 'react';
import DashboardContent from './DashboardContent';

export default function DashboardPage() {
  return (
    <Suspense fallback={<DashboardLoading />}>
      <DashboardContent />
    </Suspense>
  );
}

function DashboardLoading() {
  return (
    <div className="min-h-screen bg-slate-50">
      <div className="p-8 text-center text-slate-300">Loading...</div>
    </div>
  );
}
