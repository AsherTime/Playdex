import type { CharacterSummary } from "@/types/teams";
import { CharacterPortrait } from "@/components/game-calc/CharacterPortrait";

export function TeamMemberIcons({ members }: { members: CharacterSummary[] }) {
  return (
    <div className="flex items-center -space-x-2 sm:-space-x-2.5">
      {members.map((member, index) => (
        <div
          key={member.id}
          className="relative shrink-0 rounded-full ring-2 ring-[#070811]"
          style={{ zIndex: members.length - index }}
        >
          <CharacterPortrait
            name={member.name}
            element={member.element}
            portraitPath={member.portraitPath}
            className="h-11 w-11 rounded-full sm:h-14 sm:w-14"
          />
        </div>
      ))}
    </div>
  );
}
