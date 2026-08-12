"use client";

import { useState } from "react";
import { shareGamingSummary, shareProfileUrl } from "@/lib/share-profile";
import { profilePath } from "@/lib/username";
import { formatPlaytimeSeconds } from "@/lib/game-usage/format";

export function ShareProfileButton({
  username,
  displayName,
  weekTotalSeconds,
  gamesPlayed,
  topGames,
  focusLine,
  variant = "profile",
}: {
  username: string;
  displayName: string;
  weekTotalSeconds?: number;
  gamesPlayed?: number;
  topGames?: Array<{ name: string; time: string }>;
  focusLine?: string;
  variant?: "profile" | "summary";
}) {
  const [message, setMessage] = useState("");

  const handleShare = async () => {
    setMessage("");
    if (variant === "summary" && weekTotalSeconds != null && gamesPlayed != null && topGames) {
      const result = await shareGamingSummary({
        username,
        displayName,
        weekTotalFormatted: formatPlaytimeSeconds(weekTotalSeconds),
        gamesPlayed,
        topGames,
        focusLine,
      });
      setMessage(result.method === "share" ? "Shared!" : "Copied summary to clipboard.");
      return;
    }

    const result = await shareProfileUrl(username, displayName);
    if (result.method === "cancelled") return;
    setMessage(result.method === "share" ? "Shared!" : "Profile link copied.");
  };

  return (
    <div className="space-y-2">
      <button
        type="button"
        onClick={() => void handleShare()}
        className="rounded-full border border-indigo-400/35 bg-indigo-500/15 px-4 py-2 text-sm font-medium text-indigo-50"
      >
        {variant === "summary" ? "Share Gaming Summary" : "Share Profile"}
      </button>
      <p className="text-[11px] text-zinc-600">
        {profilePath(username)}
      </p>
      {message ? <p className="text-xs text-emerald-300">{message}</p> : null}
    </div>
  );
}
