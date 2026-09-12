import { getElementBarColors } from "@/lib/character-elements";
import { GuideSectionTitle, GuideSurface } from "@/components/guides/guide-surfaces";
import type { GuideCalculations } from "@/lib/guides/team-calculation-types";

const number = new Intl.NumberFormat("en-US", { maximumFractionDigits: 6 });
function metric(value: number | null, divisor: number, suffix: string) {
  return value === null ? "—" : `${number.format(value / divisor)}${suffix}`;
}

export function TeamCalculations({ calculations }: { calculations: GuideCalculations }) {
  if (calculations.unavailable) {
    return <p className="py-6 text-sm text-zinc-400">Team calculations coming soon.</p>;
  }
  if (!calculations.teams.length) {
    return <p className="py-6 text-sm text-zinc-400">Team calculations coming soon.</p>;
  }

  return (
    <div className="space-y-5">
      {calculations.teams.map((team) => {
        const shares = team.members.map((member) => member.damage_share ?? 0);
        const totalShare = shares.reduce((sum, value) => sum + value, 0) || 1;

        return (
          <GuideSurface key={team.id} className="space-y-5" padded>
            <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <GuideSectionTitle>Team</GuideSectionTitle>
                <h3 className="text-lg font-semibold text-white">{team.team_name}</h3>
              </div>
              <dl className="grid grid-cols-3 gap-4 sm:min-w-[18rem]">
                {[
                  ["Team DPS", metric(team.team_dps, 1000, "K")],
                  ["DPR", metric(team.dpr, 1_000_000, "M")],
                  ["Rotation", metric(team.rotation_seconds, 1, "s")],
                ].map(([label, value]) => (
                  <div key={label}>
                    <dt className="text-[10px] uppercase tracking-[0.16em] text-zinc-500">{label}</dt>
                    <dd className="mt-1 text-sm font-semibold tabular-nums text-white sm:text-base">{value}</dd>
                  </div>
                ))}
              </dl>
            </div>

            <div>
              <p className="mb-2 text-[11px] uppercase tracking-[0.16em] text-zinc-500">Damage share</p>
              <div className="flex h-3 overflow-hidden rounded-full bg-black/30">
                {team.members.map((member) => {
                  const share = member.damage_share ?? 0;
                  if (share <= 0) return null;
                  const colors = getElementBarColors(member.element ?? "");
                  return (
                    <div
                      key={`${team.id}-${member.slot}-stack`}
                      className="h-full"
                      style={{ width: `${(share / totalShare) * 100}%`, backgroundColor: colors.primary }}
                      title={`${member.character_name} ${share}%`}
                    />
                  );
                })}
              </div>
            </div>

            <div className="space-y-3">
              {team.members.map((member) => {
                const share = member.damage_share;
                const colors = getElementBarColors(member.element ?? "");
                return (
                  <div key={`${team.id}-${member.slot}`} className="grid gap-1 sm:grid-cols-[minmax(0,1fr)_4.5rem] sm:items-center">
                    <div className="min-w-0">
                      <div className="flex items-baseline justify-between gap-3">
                        <p className="truncate text-sm font-medium text-white">{member.character_name}</p>
                        <p className="text-[11px] uppercase tracking-wide text-zinc-500">{member.role ?? ""}</p>
                      </div>
                      <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-black/35">
                        <div
                          className="h-full rounded-full transition-[width] duration-500"
                          style={{
                            width: `${Math.max(share ?? 0, 0)}%`,
                            backgroundColor: colors.primary,
                          }}
                        />
                      </div>
                      <p className="mt-1 truncate text-xs text-zinc-500">
                        {member.weapon_name ?? "Weapon not provided"}
                        {member.damage !== null ? ` · ${number.format(member.damage)}` : ""}
                      </p>
                    </div>
                    <p className="text-right text-sm font-semibold tabular-nums text-zinc-200">
                      {share === null ? "—" : `${share}%`}
                    </p>
                    {member.note && member.note !== team.note ? (
                      <p className="whitespace-pre-line text-xs text-zinc-500 sm:col-span-2">{member.note}</p>
                    ) : null}
                  </div>
                );
              })}
            </div>

            {team.note ? (
              <p className="whitespace-pre-line text-sm leading-6 text-zinc-400">{team.note}</p>
            ) : null}
          </GuideSurface>
        );
      })}
    </div>
  );
}
