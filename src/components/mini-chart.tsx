export function MiniChart({
  values,
  label,
  tone = "cyan",
}: {
  values: number[];
  label: string;
  tone?: "cyan" | "violet" | "emerald";
}) {
  const width = 320;
  const height = 120;
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;
  const points = values
    .map((value, index) => {
      const x = (index / Math.max(values.length - 1, 1)) * width;
      const y = height - ((value - min) / range) * height;
      return `${x},${y}`;
    })
    .join(" ");

  const tones = {
    cyan: "stroke-cyan-300",
    violet: "stroke-violet-300",
    emerald: "stroke-emerald-300",
  };

  return (
    <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-4">
      <p className="mb-4 text-sm text-zinc-400">{label}</p>
      <svg viewBox={`0 0 ${width} ${height}`} className="h-28 w-full overflow-visible">
        <polyline
          fill="none"
          stroke="rgba(255,255,255,0.08)"
          strokeWidth="1"
          points={`0,${height} ${width},${height}`}
        />
        <polyline
          fill="none"
          className={tones[tone]}
          strokeWidth="3"
          strokeLinecap="round"
          strokeLinejoin="round"
          points={points}
        />
      </svg>
    </div>
  );
}
