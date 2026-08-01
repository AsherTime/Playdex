import type { ValorantAgent } from "@/types/valorant-improve";

export const VALORANT_AGENTS: ValorantAgent[] = [
  { id: "jett", name: "Jett", role: "Duelist" },
  { id: "reyna", name: "Reyna", role: "Duelist" },
  { id: "raze", name: "Raze", role: "Duelist" },
  { id: "phoenix", name: "Phoenix", role: "Duelist" },
  { id: "yoru", name: "Yoru", role: "Duelist" },
  { id: "neon", name: "Neon", role: "Duelist" },
  { id: "iso", name: "Iso", role: "Duelist" },
  { id: "waylay", name: "Waylay", role: "Duelist" },
  { id: "sova", name: "Sova", role: "Initiator" },
  { id: "breach", name: "Breach", role: "Initiator" },
  { id: "skye", name: "Skye", role: "Initiator" },
  { id: "kayo", name: "KAY/O", role: "Initiator" },
  { id: "fade", name: "Fade", role: "Initiator" },
  { id: "gekko", name: "Gekko", role: "Initiator" },
  { id: "tejo", name: "Tejo", role: "Initiator" },
  { id: "brimstone", name: "Brimstone", role: "Controller" },
  { id: "viper", name: "Viper", role: "Controller" },
  { id: "omen", name: "Omen", role: "Controller" },
  { id: "astra", name: "Astra", role: "Controller" },
  { id: "harbor", name: "Harbor", role: "Controller" },
  { id: "clove", name: "Clove", role: "Controller" },
  { id: "sage", name: "Sage", role: "Sentinel" },
  { id: "cypher", name: "Cypher", role: "Sentinel" },
  { id: "killjoy", name: "Killjoy", role: "Sentinel" },
  { id: "chamber", name: "Chamber", role: "Sentinel" },
  { id: "deadlock", name: "Deadlock", role: "Sentinel" },
  { id: "vyse", name: "Vyse", role: "Sentinel" },
];

export const AGENT_ROLE_COLORS: Record<ValorantAgent["role"], string> = {
  Duelist: "border-rose-400/40 bg-rose-500/15 text-rose-100",
  Initiator: "border-amber-400/35 bg-amber-500/15 text-amber-100",
  Controller: "border-emerald-400/35 bg-emerald-500/15 text-emerald-100",
  Sentinel: "border-sky-400/35 bg-sky-500/15 text-sky-100",
};
