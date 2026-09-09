export type GameCoverAsset = {
  src: string;
  /** CSS object-position chosen so logos and faces survive the 4:5 crop. */
  objectPosition: string;
  /** Provenance, kept for future maintenance and re-sourcing. */
  source: string;
  sourceUrl: string;
};

/**
 * Cover artwork keyed by canonical game slug. Adding a game means dropping a
 * file into public/assets/game-covers/ and adding one entry here; games with no
 * entry fall back to their gradient tone.
 */
const GAME_COVERS: Record<string, GameCoverAsset> = {
  "genshin-impact": {
    src: "/assets/game-covers/genshin-impact.webp",
    objectPosition: "center",
    source: "Epic Games Store product art",
    sourceUrl:
      "https://cdn2.unrealengine.com/egs-genshinimpact-cognospherepteltd-s2-1200x1600-f33338ee244c.jpg",
  },
  valorant: {
    src: "/assets/game-covers/valorant.webp",
    objectPosition: "center",
    source: "Epic Games Store product art",
    sourceUrl:
      "https://cdn2.unrealengine.com/egs-valorant-riotgames-s2-1200x1600-45ecd201ffcc.jpg",
  },
  "league-of-legends": {
    src: "/assets/game-covers/league-of-legends.webp",
    objectPosition: "center",
    source: "Epic Games Store product art",
    sourceUrl: "https://cdn2.unrealengine.com/epic-1200x1600-1200x1600-62d626f118e0.png",
  },
  "wuthering-waves": {
    src: "/assets/game-covers/wuthering-waves.webp",
    objectPosition: "bottom",
    source: "Steam store library capsule (app 3513350)",
    sourceUrl:
      "https://shared.cloudflare.steamstatic.com/store_item_assets/steam/apps/3513350/831a03c6ad733c3b36dc8e8497a3949bc03b0042/library_capsule_2x.jpg",
  },
  "free-fire": {
    src: "/assets/game-covers/free-fire.webp",
    objectPosition: "top",
    source: "Official Garena Free Fire wallpaper",
    sourceUrl:
      "https://cdn.wildflamestudio.com/common/web_event/official2.ff.garena.all/202210/24965e9602f2655818c41ca581d6df23.jpg",
  },
};

export function getGameCoverAsset(slug: string): GameCoverAsset | null {
  return GAME_COVERS[slug] ?? null;
}
