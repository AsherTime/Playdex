const ELEMENT_STYLES: Record<string, { bg: string; ring: string; text: string }> = {
  Pyro: { bg: "from-orange-600/50 to-red-700/40", ring: "ring-orange-400/40", text: "text-orange-100" },
  Hydro: { bg: "from-cyan-500/45 to-blue-600/40", ring: "ring-cyan-400/40", text: "text-cyan-100" },
  Anemo: { bg: "from-teal-400/40 to-emerald-500/35", ring: "ring-teal-300/40", text: "text-teal-100" },
  Electro: { bg: "from-violet-500/45 to-purple-700/40", ring: "ring-violet-400/40", text: "text-violet-100" },
  Dendro: { bg: "from-lime-500/40 to-green-700/35", ring: "ring-lime-400/40", text: "text-lime-100" },
  Cryo: { bg: "from-sky-300/40 to-blue-400/35", ring: "ring-sky-300/40", text: "text-sky-100" },
  Geo: { bg: "from-amber-500/40 to-yellow-700/35", ring: "ring-amber-400/40", text: "text-amber-100" },
  Fusion: { bg: "from-orange-500/45 to-red-600/40", ring: "ring-orange-400/40", text: "text-orange-100" },
  Aero: { bg: "from-emerald-400/40 to-teal-500/35", ring: "ring-emerald-300/40", text: "text-emerald-100" },
  Spectro: { bg: "from-fuchsia-400/40 to-purple-500/35", ring: "ring-fuchsia-300/40", text: "text-fuchsia-100" },
  Havoc: { bg: "from-purple-600/45 to-indigo-800/40", ring: "ring-purple-400/40", text: "text-purple-100" },
  Glacio: { bg: "from-blue-300/40 to-cyan-400/35", ring: "ring-blue-300/40", text: "text-blue-100" },
};

const DEFAULT_STYLE = {
  bg: "from-zinc-600/40 to-zinc-800/40",
  ring: "ring-zinc-400/30",
  text: "text-zinc-100",
};

const ELEMENT_BAR_COLORS: Record<string, { primary: string; accent: string }> = {
  Pyro: { primary: "#E25822", accent: "#FF6A2A" },
  Hydro: { primary: "#1C8FE0", accent: "#4FC3F7" },
  Dendro: { primary: "#6DDC6D", accent: "#A8F08C" },
  Electro: { primary: "#A55CCF", accent: "#D08CFF" },
  Anemo: { primary: "#64E3C3", accent: "#9FFFE0" },
  Cryo: { primary: "#9BE0F9", accent: "#D6F4FF" },
  Geo: { primary: "#D4A017", accent: "#F2C94C" },
  Fusion: { primary: "#D45772", accent: "#FF6B8A" },
  Aero: { primary: "#44C4A3", accent: "#5FE0C0" },
  Spectro: { primary: "#B7A835", accent: "#D4C44A" },
  Havoc: { primary: "#BE4981", accent: "#E060A0" },
  Glacio: { primary: "#4FB4CF", accent: "#7AD4EA" },
};

const DEFAULT_BAR_COLORS = { primary: "#6366F1", accent: "#818CF8" };

export function getElementStyle(element: string) {
  return ELEMENT_STYLES[element] ?? DEFAULT_STYLE;
}

export function getElementBarColors(element: string) {
  return ELEMENT_BAR_COLORS[element] ?? DEFAULT_BAR_COLORS;
}

export function getCharacterInitials(name: string) {
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) {
    return `${parts[0][0] ?? ""}${parts[1][0] ?? ""}`.toUpperCase();
  }
  return name.slice(0, 2).toUpperCase();
}
