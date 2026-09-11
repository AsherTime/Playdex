"use client";

import { TeamBreakdownBar } from "@/components/game-calc/TeamBreakdownBar";
import type { GuideCalculations } from "@/lib/guides/team-calculation-types";

const number = new Intl.NumberFormat("en-US", { maximumFractionDigits: 6 });
function metric(value: number | null, divisor: number, suffix: string) {
  return value === null ? "Not provided" : `${number.format(value / divisor)}${suffix}`;
}

export function TeamCalculations({ calculations }: { calculations: GuideCalculations }) {
  if (calculations.unavailable) return <p className="p-4 text-sm text-zinc-400">Team calculations are temporarily unavailable.</p>;
  if (!calculations.teams.length) return <p className="p-4 text-sm text-zinc-400">No team calculations available yet.</p>;
  return (
    <div className="space-y-6">
      {calculations.teams.map(team => (
        <article key={team.id} data-calculation-id={team.id} className="overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03]">
          <header className="flex flex-wrap items-center justify-between gap-4 border-b border-white/10 px-4 py-5 sm:px-6">
            <h3 className="text-lg font-semibold text-white">{team.team_name}</h3>
            <dl className="grid grid-cols-3 divide-x divide-white/10 rounded-xl border border-white/10 bg-black/20">
              {[
                ["Team DPS", metric(team.team_dps, 1000, "K")],
                ["DPR", metric(team.dpr, 1_000_000, "M")],
                ["Rotation", metric(team.rotation_seconds, 1, "s")],
              ].map(([label, value]) => (
                <div key={label} className="px-3 py-3 text-center">
                  <dt className="text-[10px] uppercase tracking-wider text-zinc-500">{label}</dt>
                  <dd className="mt-1 text-sm font-semibold tabular-nums text-white sm:text-lg">{value}</dd>
                </div>
              ))}
            </dl>
          </header>
          <div className="relative overflow-x-auto px-3 py-8 sm:px-6">
            <div className="pointer-events-none absolute -right-20 -top-20 h-56 w-56 rounded-full bg-indigo-500/10 blur-3xl" />
            <p className="mb-6 text-center text-[10px] uppercase tracking-[0.22em] text-zinc-500">Damage distribution</p>
            <div className="relative mx-auto flex min-w-[340px] max-w-3xl items-start justify-center gap-3 sm:gap-5">
              {team.members.map(member => (
                <div key={member.slot} className="min-w-0 flex-1">
                  {member.damage_share !== null ? (
                    <TeamBreakdownBar gameId="genshin-impact" maxShare={100} source={{
                      id: member.character_id, name: member.character_name, role: member.role ?? "",
                      element: member.element ?? "", share: member.damage_share,
                      portraitPath: member.portraitPath, weaponPath: member.weaponPath,
                      weaponName: member.weapon_name ?? "Weapon not provided",
                    }} />
                  ) : <p className="text-center text-xs text-zinc-400">{member.character_name}: share not provided</p>}
                  <p className="mt-2 break-words text-center text-xs text-zinc-400">{member.weapon_name ?? "Weapon not provided"}</p>
                  {member.damage !== null ? <p className="mt-1 text-center text-xs tabular-nums text-zinc-300">Damage: {number.format(member.damage)}</p> : null}
                  {member.note && member.note !== team.note ? <p className="mt-2 whitespace-pre-line text-xs text-zinc-400">{member.note}</p> : null}
                </div>
              ))}
            </div>
          </div>
          {team.note ? <p className="whitespace-pre-line border-t border-white/10 px-4 py-4 text-sm leading-6 text-zinc-400 sm:px-6">{team.note}</p> : null}
        </article>
      ))}
    </div>
  );
}
