import type { FreeFireRank } from "@/types/free-fire-improve";

const RANK_STYLES: Record<FreeFireRank, string> = {
  Bronze: "from-orange-800/35 to-orange-950/20 text-orange-100 border-orange-500/25",
  Silver: "from-slate-400/25 to-slate-600/15 text-slate-100 border-slate-300/25",
  Gold: "from-yellow-500/25 to-amber-700/15 text-yellow-100 border-yellow-400/25",
  Platinum: "from-teal-400/20 to-cyan-700/15 text-teal-100 border-teal-300/25",
  Diamond: "from-sky-400/25 to-blue-700/15 text-sky-100 border-sky-400/25",
  Heroic: "from-violet-500/25 to-purple-800/15 text-violet-100 border-violet-400/30",
  "Elite Heroic": "from-fuchsia-500/25 to-rose-800/15 text-fuchsia-100 border-fuchsia-400/30",
  Grandmaster: "from-amber-300/30 to-orange-600/20 text-amber-50 border-amber-200/35",
};

export function FreeFireRankBadge({
  rank,
  selected = false,
  onClick,
}: {
  rank: FreeFireRank;
  selected?: boolean;
  onClick?: () => void;
}) {
  const style = RANK_STYLES[rank];
  const Tag = onClick ? "button" : "div";

  return (
    <Tag
      type={onClick ? "button" : undefined}
      onClick={onClick}
      className={`rounded-xl border bg-gradient-to-br px-3 py-2 text-sm font-semibold transition ${style} ${
        onClick ? "hover:scale-[1.02] active:scale-[0.98]" : ""
      } ${selected ? "ring-2 ring-orange-400/50 ring-offset-2 ring-offset-[#070811]" : ""}`}
    >
      {rank}
    </Tag>
  );
}
