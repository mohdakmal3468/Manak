interface ScoreBadgeProps {
  score: number | null;
  label?: string;
}

export default function ScoreBadge({
  score,
  label = "Overall score",
}: ScoreBadgeProps) {
  return (
    <div
      aria-label={score === null ? `${label}: not rated` : `${label}: ${score.toFixed(1)}`}
      className="inline-flex items-center gap-2 rounded-full bg-brand-50 px-3 py-1.5 text-sm"
    >
      <span className="font-medium text-brand-700">{label}</span>
      <span className="font-semibold tabular-nums text-brand-700">
        {score === null ? "Not rated" : score.toFixed(1)}
      </span>
    </div>
  );
}
