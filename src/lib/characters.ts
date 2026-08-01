import { mockCharacters } from "@/data/mock-characters";
import type { CalcGameId, CharacterSummary } from "@/types/teams";
import { isCalcGame } from "@/lib/team-games";

export function getCharactersForGame(gameIdOrSlug: string): CharacterSummary[] {
  if (!isCalcGame(gameIdOrSlug)) return [];
  return mockCharacters.filter((character) => character.gameId === gameIdOrSlug);
}

export function getCharacter(
  gameIdOrSlug: CalcGameId,
  characterSlug: string,
): CharacterSummary | undefined {
  return mockCharacters.find(
    (character) => character.gameId === gameIdOrSlug && character.slug === characterSlug,
  );
}

export function getAllCalcCharacterParams() {
  return mockCharacters.map((character) => ({
    slug: character.gameId,
    characterSlug: character.slug,
  }));
}
