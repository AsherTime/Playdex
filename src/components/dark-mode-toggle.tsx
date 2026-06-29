"use client";

import { useState } from "react";

export function DarkModeToggle() {
  const [enabled, setEnabled] = useState(true);

  return (
    <button
      type="button"
      onClick={() => setEnabled((value) => !value)}
      className="flex w-full items-center justify-between rounded-2xl px-3 py-2 text-sm text-zinc-300 transition hover:bg-white/[0.05]"
    >
      <span>Dark Mode</span>
      <span className={`rounded-full px-2 py-1 text-xs ${enabled ? "bg-indigo-400/20 text-indigo-200" : "bg-white/10 text-zinc-400"}`}>
        {enabled ? "On" : "Off"}
      </span>
    </button>
  );
}
