"use client";

import { useEffect, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { GameWithTrend, TrendMetric } from "@/types/gamedex";

const colors = ["#818cf8", "#a78bfa", "#38bdf8", "#22c55e", "#f59e0b", "#f472b6"];

export function TrendChart({
  kind,
  activityData,
  gameData,
  breakdownData,
}: {
  kind: "activity" | "games" | "genres" | "platforms";
  activityData?: TrendMetric[];
  gameData?: GameWithTrend[];
  breakdownData?: { name: string; value: number }[];
}) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const timer = window.setTimeout(() => setMounted(true), 0);
    return () => window.clearTimeout(timer);
  }, []);

  if (!mounted) {
    return (
      <ChartShell title={getChartTitle(kind)}>
        <div className="h-[280px] animate-pulse rounded-[1.5rem] bg-white/[0.03]" />
      </ChartShell>
    );
  }

  if (kind === "activity" && activityData) {
    return (
      <ChartShell title="Cross-platform activity">
        <ChartViewport>
          <LineChart width={560} height={280} data={activityData}>
            <CartesianGrid stroke="rgba(255,255,255,0.08)" vertical={false} />
            <XAxis dataKey="date" tick={{ fill: "#a1a1aa", fontSize: 12 }} />
            <YAxis tick={{ fill: "#a1a1aa", fontSize: 12 }} />
            <Tooltip contentStyle={{ background: "#0b1020", border: "1px solid rgba(255,255,255,0.12)", borderRadius: 16 }} />
            <Legend />
            <Line type="monotone" dataKey="steam" stroke="#818cf8" strokeWidth={3} dot={false} />
            <Line type="monotone" dataKey="twitch" stroke="#a78bfa" strokeWidth={3} dot={false} />
            <Line type="monotone" dataKey="youtube" stroke="#38bdf8" strokeWidth={3} dot={false} />
            <Line type="monotone" dataKey="reddit" stroke="#22c55e" strokeWidth={3} dot={false} />
          </LineChart>
        </ChartViewport>
      </ChartShell>
    );
  }

  if (kind === "games" && gameData) {
    const chartData = gameData.slice(0, 6).map((game) => ({
      title: game.title,
      score: game.trend.score,
    }));

    return (
      <ChartShell title="Top trending games">
        <ChartViewport>
          <BarChart width={560} height={280} data={chartData}>
            <CartesianGrid stroke="rgba(255,255,255,0.08)" vertical={false} />
            <XAxis dataKey="title" tick={{ fill: "#a1a1aa", fontSize: 12 }} />
            <YAxis tick={{ fill: "#a1a1aa", fontSize: 12 }} />
            <Tooltip contentStyle={{ background: "#0b1020", border: "1px solid rgba(255,255,255,0.12)", borderRadius: 16 }} />
            <Bar dataKey="score" radius={[12, 12, 0, 0]} fill="#818cf8" />
          </BarChart>
        </ChartViewport>
      </ChartShell>
    );
  }

  if ((kind === "genres" || kind === "platforms") && breakdownData) {
    return (
      <ChartShell title={kind === "genres" ? "Genre breakdown" : "Platform breakdown"}>
        <ChartViewport>
          <PieChart width={560} height={280}>
            <Pie
              data={breakdownData}
              dataKey="value"
              nameKey="name"
              innerRadius={70}
              outerRadius={105}
              paddingAngle={3}
            >
              {breakdownData.map((entry, index) => (
                <Cell key={entry.name} fill={colors[index % colors.length]} />
              ))}
            </Pie>
            <Tooltip contentStyle={{ background: "#0b1020", border: "1px solid rgba(255,255,255,0.12)", borderRadius: 16 }} />
            <Legend />
          </PieChart>
        </ChartViewport>
      </ChartShell>
    );
  }

  return null;
}

function ChartShell({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-[2rem] border border-white/10 bg-white/[0.03] p-4">
      <h2 className="mb-4 text-sm font-medium text-white">{title}</h2>
      {children}
    </section>
  );
}

function ChartViewport({ children }: { children: React.ReactNode }) {
  return <div className="overflow-x-auto">{children}</div>;
}

function getChartTitle(kind: "activity" | "games" | "genres" | "platforms") {
  switch (kind) {
    case "activity":
      return "Cross-platform activity";
    case "games":
      return "Top trending games";
    case "genres":
      return "Genre breakdown";
    case "platforms":
      return "Platform breakdown";
  }
}
