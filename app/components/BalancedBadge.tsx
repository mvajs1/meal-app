/**
 * Balanced badge indicator.
 * FLAW 8: Uses color only (green/red) with no text label or aria attribute.
 * Screen readers get no semantic information about balanced status.
 */
export default function BalancedBadge({
  isBalanced,
  feedback,
  showFeedback = true,
  size = 'md',
}: {
  isBalanced: boolean;
  feedback: string;
  showFeedback?: boolean;
  size?: 'sm' | 'md';
}) {
  const dotSize = size === 'sm' ? 'w-3 h-3' : 'w-5 h-5';

  return (
    <div className="flex items-center gap-2" data-testid="balanced-badge">
      {/* Flaw 8: no aria-label, no text inside — color is the only indicator */}
      <div
        data-testid={`balanced-indicator-${isBalanced ? 'balanced' : 'unbalanced'}`}
        className={`${dotSize} rounded-full flex-shrink-0 ${
          isBalanced ? 'bg-emerald-500' : 'bg-red-400'
        }`}
      />
      {showFeedback && feedback && (
        <span className={`text-slate-600 ${size === 'sm' ? 'text-xs' : 'text-sm'}`}>
          {feedback}
        </span>
      )}
    </div>
  );
}
