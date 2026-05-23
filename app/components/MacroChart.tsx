interface MacroBarProps {
  label: string;
  current: number;
  total: number;
  percent: number;
  bgColor: string;
  fillColor: string;
}

function MacroBar({ label, current, total, percent, bgColor, fillColor }: MacroBarProps) {
  const progress = Math.min(percent / 100, 1);
  const remaining = Math.max(0, total - Math.round(current));

  return (
    <div className="space-y-1" data-testid={`macro-bar-${label.toLowerCase()}`}>
      <div className="flex items-center justify-between text-sm">
        <span className="font-medium text-slate-700">{label}</span>
        <span className="text-slate-500 text-xs">
          {Math.round(current)}g / {total}g
          <span className="text-slate-400 ml-1">({remaining}g left)</span>
        </span>
      </div>
      <div className={`h-2.5 rounded-full ${bgColor} overflow-hidden`}>
        <div
          className={`h-full rounded-full ${fillColor} transition-all duration-300`}
          style={{ width: `${progress * 100}%` }}
        />
      </div>
    </div>
  );
}

export default function MacroChart({
  proteinPercent,
  carbsPercent,
  fatPercent,
  totalProtein = 0,
  totalCarbs = 0,
  totalFat = 0,
  proteinTarget = 85,
  carbsTarget = 165,
  fatTarget = 65,
}: {
  proteinPercent: number;
  carbsPercent: number;
  fatPercent: number;
  totalProtein?: number;
  totalCarbs?: number;
  totalFat?: number;
  proteinTarget?: number;
  carbsTarget?: number;
  fatTarget?: number;
}) {
  return (
    <div className="space-y-3 py-2" data-testid="macro-chart">
      <MacroBar
        label="Protein"
        current={totalProtein}
        total={proteinTarget}
        percent={proteinPercent}
        bgColor="bg-amber-100"
        fillColor="bg-amber-500"
      />
      <MacroBar
        label="Carbs"
        current={totalCarbs}
        total={carbsTarget}
        percent={carbsPercent}
        bgColor="bg-emerald-100"
        fillColor="bg-emerald-500"
      />
      <MacroBar
        label="Fat"
        current={totalFat}
        total={fatTarget}
        percent={fatPercent}
        bgColor="bg-violet-100"
        fillColor="bg-violet-500"
      />
    </div>
  );
}
