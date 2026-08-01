export const FOLLOWABLE_GAMES = [
  { slug: "genshin-impact", title: "Genshin Impact" },
  { slug: "honkai-star-rail", title: "Honkai: Star Rail" },
  { slug: "zenless-zone-zero", title: "Zenless Zone Zero" },
  { slug: "wuthering-waves", title: "Wuthering Waves" },
  { slug: "valorant", title: "Valorant" },
  { slug: "league-of-legends", title: "League of Legends" },
  { slug: "free-fire", title: "Free Fire" },
] as const;

export type FollowableGameSlug = (typeof FOLLOWABLE_GAMES)[number]["slug"];
