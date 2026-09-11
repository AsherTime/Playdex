"use client";

import { useState } from "react";
import { ImproveCard } from "@/components/valorant-improve/ImproveShell";
import type {
  AnalysisBoard,
  AnalysisTrend,
  CategoryScore,
  MapScore,
  MetricScore,
  PlayerMetrics,
  ScoreCategoryId,
  ScoreLabel,
} from "@/lib/valorant-coach/types";

type View =
  | { kind: "board" }
  | { kind: "category"; id: ScoreCategoryId }
  | { kind: "maps" }
  | { kind: "map"; name: string };

const TREND: Record<AnalysisTrend, { glyph: string; label: string }> = {
  up: { glyph: "↑", label: "Up" },
  down: { glyph: "↓", label: "Down" },
  stable: { glyph: "→", label: "Flat" },
  unknown: { glyph: "→", label: "Flat" },
};

function scoreTone(score: number) {
  if (score >= 80) return "text-emerald-300";
  if (score >= 65) return "text-white";
  if (score >= 45) return "text-amber-200";
  return "text-rose-300";
}

function ratingTone(rating: ScoreLabel) {
  if (rating === "Excellent") return "text-emerald-300";
  if (rating === "Good") return "text-zinc-200";
  if (rating === "Average") return "text-amber-200";
  return "text-rose-300";
}

function sourceMark(source: CategoryScore["source"] | MapScore["source"]) {
  return source === "riot" ? null : "Estimated";
}

function pct(value: number | null | undefined) {
  if (value == null) return "—";
  return `${Math.round(value * (value <= 1 ? 100 : 1))}%`;
}

function trendBars(score: number, trend: AnalysisTrend) {
  const base = [score - 10, score - 6, score - 3, score - 1, score];
  const shift = trend === "up" ? [-14, -9, -5, -2, 0] : trend === "down" ? [8, 5, 2, 1, 0] : [-2, 1, -1, 2, 0];
  return base.map((value, index) => Math.max(8, Math.min(100, value + shift[index])));
}

export function AnalysisPanel({
  board,
  metrics,
}: {
  board: AnalysisBoard;
  metrics: PlayerMetrics;
}) {
  const [view, setView] = useState<View>({ kind: "board" });

  const category = view.kind === "category" ? board.categories.find((item) => item.id === view.id) : null;
  const selectedMap = view.kind === "map" ? board.maps.find((item) => item.map === view.name) : null;

  return (
    <div className="space-y-4">
      {view.kind === "board" ? <BoardView board={board} onOpen={setView} /> : null}

      {view.kind === "maps" ? (
        <MapsView
          board={board}
          onBack={() => setView({ kind: "board" })}
          onOpenMap={(name) => setView({ kind: "map", name })}
        />
      ) : null}

      {view.kind === "category" && category ? (
        <CategoryDetail
          category={category}
          metrics={metrics}
          onBack={() => setView({ kind: "board" })}
        />
      ) : null}

      {view.kind === "map" && selectedMap ? (
        <MapDetail
          map={selectedMap}
          onBack={() => setView({ kind: "maps" })}
        />
      ) : null}
    </div>
  );
}

function BoardView({
  board,
  onOpen,
}: {
  board: AnalysisBoard;
  onOpen: (view: View) => void;
}) {
  return (
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
      {board.categories.map((item) => (
        <button
          key={item.id}
          type="button"
          onClick={() =>
            onOpen(item.id === "map" ? { kind: "maps" } : { kind: "category", id: item.id })
          }
          className="rounded-2xl border border-white/10 bg-white/[0.03] p-5 text-left transition hover:border-white/20 hover:bg-white/[0.05] sm:p-6"
          aria-label={`${item.label}, ${item.score} of 100, ${item.rating}, ${TREND[item.trend].label}`}
        >
          <div className="flex items-start justify-between gap-3">
            <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-zinc-400">
              {item.label}
            </p>
            {sourceMark(item.source) ? (
              <span className="text-[10px] uppercase tracking-wide text-zinc-600">
                {sourceMark(item.source)}
              </span>
            ) : null}
          </div>
          <p className={`mt-4 font-semibold tabular-nums leading-none ${scoreTone(item.score)}`}>
            <span className="text-6xl sm:text-7xl">{item.score}</span>
            <span className="ml-1 text-lg text-zinc-500">/100</span>
          </p>
          <div className="mt-5 flex items-center justify-between text-sm">
            <span className={`font-medium ${ratingTone(item.rating)}`}>{item.rating}</span>
            <span className="tabular-nums text-zinc-400">
              {TREND[item.trend].glyph} {TREND[item.trend].label}
            </span>
          </div>
        </button>
      ))}
    </div>
  );
}

function MapsView({
  board,
  onBack,
  onOpenMap,
}: {
  board: AnalysisBoard;
  onBack: () => void;
  onOpenMap: (name: string) => void;
}) {
  const mapCategory = board.categories.find((item) => item.id === "map");

  return (
    <div className="space-y-4">
      <BackButton onClick={onBack} label="Analysis" />
      {mapCategory ? (
        <div className="flex items-end justify-between gap-4 px-1">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-zinc-500">
              Map Performance
            </p>
            <p className={`mt-2 text-5xl font-semibold tabular-nums ${scoreTone(mapCategory.score)}`}>
              {mapCategory.score}
              <span className="ml-1 text-lg text-zinc-500">/100</span>
            </p>
          </div>
          <p className="text-sm text-zinc-400">
            {mapCategory.rating} {TREND[mapCategory.trend].glyph}
          </p>
        </div>
      ) : null}

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {board.maps.map((item) => (
          <button
            key={item.map}
            type="button"
            onClick={() => onOpenMap(item.map)}
            className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 text-left transition hover:border-white/20 hover:bg-white/[0.05]"
            aria-label={`${item.map}, ${item.score10} of 10, ${item.rating}`}
          >
            <div className="flex items-start justify-between">
              <p className="text-sm font-semibold text-white">{item.map}</p>
              {sourceMark(item.source) ? (
                <span className="text-[10px] uppercase tracking-wide text-zinc-600">Estimated</span>
              ) : null}
            </div>
            <p className={`mt-3 text-4xl font-semibold tabular-nums ${scoreTone(item.score10 * 10)}`}>
              {item.score10}
              <span className="ml-1 text-base text-zinc-500">/10</span>
            </p>
            <div className="mt-3 flex items-center justify-between text-xs">
              <span className={ratingTone(item.rating)}>{item.rating}</span>
              <span className="text-zinc-500">{TREND[item.trend].glyph}</span>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}

function CategoryDetail({
  category,
  metrics,
  onBack,
}: {
  category: CategoryScore;
  metrics: PlayerMetrics;
  onBack: () => void;
}) {
  return (
    <div className="space-y-4">
      <BackButton onClick={onBack} label="Analysis" />
      <ImproveCard className="p-5 sm:p-6">
        <div className="flex items-end justify-between gap-4">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-zinc-500">
              {category.label}
            </p>
            <p className={`mt-2 text-6xl font-semibold tabular-nums ${scoreTone(category.score)}`}>
              {category.score}
              <span className="ml-1 text-lg text-zinc-500">/100</span>
            </p>
          </div>
          <div className="text-right text-sm">
            <p className={ratingTone(category.rating)}>{category.rating}</p>
            <p className="mt-1 text-zinc-500">
              {TREND[category.trend].glyph} {TREND[category.trend].label}
            </p>
          </div>
        </div>
      </ImproveCard>

      <div className="grid gap-3">
        {category.metrics.map((item) => (
          <MetricRow key={item.key} metric={item} />
        ))}
      </div>

      {category.id === "aim" ? <HitMix head={metrics.headHitShare} body={metrics.bodyHitShare} /> : null}
      {category.id === "survivability" ? (
        <BalanceRow
          leftLabel="First kills"
          left={metrics.firstKillRate}
          rightLabel="First deaths"
          right={metrics.firstDeathRate}
        />
      ) : null}

      <TrendStrip score={category.score} trend={category.trend} />
      <WhyNote text={category.recommendation} />
    </div>
  );
}

function MapDetail({ map, onBack }: { map: MapScore; onBack: () => void }) {
  return (
    <div className="space-y-4">
      <BackButton onClick={onBack} label="Maps" />
      <ImproveCard className="p-5 sm:p-6">
        <div className="flex items-end justify-between gap-4">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-zinc-500">{map.map}</p>
            <p className={`mt-2 text-6xl font-semibold tabular-nums ${scoreTone(map.score10 * 10)}`}>
              {map.score10}
              <span className="ml-1 text-lg text-zinc-500">/10</span>
            </p>
          </div>
          <div className="text-right text-sm">
            <p className={ratingTone(map.rating)}>{map.rating}</p>
            <p className="mt-1 text-zinc-500">
              {TREND[map.trend].glyph} {TREND[map.trend].label}
            </p>
          </div>
        </div>
      </ImproveCard>

      <div className="grid gap-3 sm:grid-cols-2">
        <StatTile label="Win rate" value={pct(map.winRate)} />
        <StatTile label="K/D" value={map.kd != null ? map.kd.toFixed(2) : "—"} />
        <StatTile label="Attack" value={pct(map.attackWinRate)} />
        <StatTile label="Defense" value={pct(map.defenseWinRate)} />
        <StatTile label="Opening fights" value={`${map.firstKills ?? "—"} FK / ${map.firstDeaths ?? "—"} FD`} />
        <StatTile label="Agents" value={map.agents.length ? map.agents.join(", ") : "—"} />
        <StatTile label="Recent form" value={map.recentForm ?? "—"} />
        <StatTile label="Trend" value={`${TREND[map.trend].glyph} ${TREND[map.trend].label}`} />
      </div>

      <BalanceRow label="Attack vs Defense" leftLabel="Attack" left={map.attackWinRate} rightLabel="Defense" right={map.defenseWinRate} />
      <WhyNote text={map.recommendation} />
    </div>
  );
}

function MetricRow({ metric }: { metric: MetricScore }) {
  return (
    <ImproveCard className="px-4 py-3">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-sm text-white">{metric.label}</p>
          <p className="mt-0.5 text-[10px] uppercase tracking-wide text-zinc-600">
            {sourceMark(metric.source) ?? "Live"}
          </p>
        </div>
        <div className="text-right">
          <p className="text-lg font-semibold tabular-nums text-white">{metric.display}</p>
          <p className={`text-xs tabular-nums ${scoreTone(metric.score)}`}>{metric.score}</p>
        </div>
      </div>
      <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-black/40">
        <div
          className="h-full rounded-full bg-gradient-to-r from-rose-500 to-orange-400"
          style={{ width: `${metric.score}%` }}
        />
      </div>
    </ImproveCard>
  );
}

function HitMix({ head, body }: { head: number | null; body: number | null }) {
  const rows = [
    { label: "Head", value: head },
    { label: "Body", value: body },
  ];
  return (
    <ImproveCard className="p-4">
      <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-zinc-500">Hit distribution</p>
      <div className="mt-3 space-y-2">
        {rows.map((row) => (
          <div key={row.label} className="flex items-center gap-3">
            <span className="w-12 text-xs text-zinc-400">{row.label}</span>
            <div className="h-2 flex-1 overflow-hidden rounded-full bg-black/40">
              <div
                className="h-full rounded-full bg-rose-400"
                style={{ width: `${Math.round((row.value ?? 0) * 100)}%` }}
              />
            </div>
            <span className="w-10 text-right text-xs tabular-nums text-zinc-300">{pct(row.value)}</span>
          </div>
        ))}
      </div>
    </ImproveCard>
  );
}

function BalanceRow({
  label = "First-kill vs first-death",
  leftLabel,
  left,
  rightLabel,
  right,
}: {
  label?: string;
  leftLabel: string;
  left: number | null | undefined;
  rightLabel: string;
  right: number | null | undefined;
}) {
  const leftPct = (left ?? 0) <= 1 ? (left ?? 0) * 100 : (left ?? 0);
  const rightPct = (right ?? 0) <= 1 ? (right ?? 0) * 100 : (right ?? 0);
  const total = leftPct + rightPct || 1;
  return (
    <ImproveCard className="p-4">
      <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-zinc-500">{label}</p>
      <div className="mt-3 flex h-2 overflow-hidden rounded-full bg-black/40">
        <div className="bg-emerald-400" style={{ width: `${(leftPct / total) * 100}%` }} />
        <div className="bg-rose-400" style={{ width: `${(rightPct / total) * 100}%` }} />
      </div>
      <div className="mt-2 flex justify-between text-xs text-zinc-400">
        <span>
          {leftLabel} {pct(left ?? null)}
        </span>
        <span>
          {rightLabel} {pct(right ?? null)}
        </span>
      </div>
    </ImproveCard>
  );
}

function TrendStrip({ score, trend }: { score: number; trend: AnalysisTrend }) {
  const bars = trendBars(score, trend);
  return (
    <ImproveCard className="p-4">
      <div className="flex items-center justify-between">
        <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-zinc-500">Recent trend</p>
        <span className="text-[10px] uppercase tracking-wide text-zinc-600">Estimated</span>
      </div>
      <div className="mt-4 flex h-16 items-end gap-2">
        {bars.map((value, index) => (
          <div
            key={index}
            className="flex-1 rounded-sm bg-gradient-to-t from-rose-500 to-orange-300"
            style={{ height: `${value}%` }}
          />
        ))}
      </div>
    </ImproveCard>
  );
}

function WhyNote({ text }: { text: string }) {
  const [open, setOpen] = useState(false);
  return (
    <ImproveCard className="p-4">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className="flex w-full items-center justify-between text-left text-sm text-zinc-300"
      >
        <span>Why this score</span>
        <span className="text-zinc-500">{open ? "−" : "+"}</span>
      </button>
      {open ? <p className="mt-3 text-sm leading-6 text-zinc-400">{text}</p> : null}
    </ImproveCard>
  );
}

function StatTile({ label, value }: { label: string; value: string }) {
  return (
    <ImproveCard className="p-4">
      <p className="text-[10px] uppercase tracking-[0.16em] text-zinc-500">{label}</p>
      <p className="mt-2 text-lg font-semibold tabular-nums text-white">{value}</p>
    </ImproveCard>
  );
}

function BackButton({ onClick, label }: { onClick: () => void; label: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="text-xs text-zinc-500 transition hover:text-zinc-300"
    >
      ← {label}
    </button>
  );
}
