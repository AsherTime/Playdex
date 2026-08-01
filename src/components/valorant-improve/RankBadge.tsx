import type { ValorantRank } from "@/types/valorant-improve";

const RANK_STYLES: Record<ValorantRank, string> = {
  Iron: "from-zinc-500/30 to-zinc-700/20 text-zinc-200 border-zinc-400/25",
  Bronze: "from-orange-800/35 to-orange-950/20 text-orange-100 border-orange-500/25",
  Silver: "from-slate-400/25 to-slate-600/15 text-slate-100 border-slate-300/25",
  Gold: "from-yellow-500/25 to-amber-700/15 text-yellow-100 border-yellow-400/25",
  Platinum: "from-teal-400/20 to-cyan-700/15 text-teal-100 border-teal-300/25",
  Diamond: "from-purple-500/25 to-indigo-700/15 text-purple-100 border-purple-400/25",
  Ascendant: "from-emerald-400/20 to-green-700/15 text-emerald-100 border-emerald-300/25",
  Immortal: "from-rose-500/25 to-red-800/15 text-rose-100 border-rose-400/30",
  Radiant: "from-yellow-300/30 to-amber-500/20 text-yellow-50 border-yellow-200/35",
};

export function RankBadge({
  rank,
  selected = false,
  onClick,
}: {
  rank: ValorantRank;
  selected?: boolean;
  onClick?: () => void;
}) {
  const style = RANK_STYLES[rank];
  const Tag = onClick ? "button" : "div";

  return (
    <Tag
      type={onClick ? "button" : undefined}
      onClick={onClick}
      className={`rounded-xl border bg-gradient-to-br px-3 py-2 text-sm font-semibold transition ${
        style
      } ${onClick ? "hover:scale-[1.02] active:scale-[0.98]" : ""} ${
        selected ? "ring-2 ring-rose-400/50 ring-offset-2 ring-offset-[#070811]" : ""
      }`}
    >
      {rank}
    </Tag>
  );
}
