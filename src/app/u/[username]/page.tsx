import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PublicGamingProfileView } from "@/components/profile/PublicGamingProfileView";
import { fetchPublicGamingProfile, getAppBaseUrl } from "@/lib/public-profile";

type PageProps = {
  params: Promise<{ username: string }>;
};

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { username } = await params;
  const profile = await fetchPublicGamingProfile(username);

  if (!profile || profile.private) {
    return {
      title: profile?.private ? "Private profile | Gamedex" : "Profile not found | Gamedex",
    };
  }

  const displayName = profile.displayName ?? profile.username ?? "Gamer";
  const description = `View ${displayName}'s gaming profile, playtime, games and improvement progress on Gamedex.`;
  const url = `${getAppBaseUrl()}/u/${encodeURIComponent(username)}`;

  return {
    title: `${displayName} (@${profile.username}) | Gamedex`,
    description,
    openGraph: {
      title: `${displayName} (@${profile.username}) | Gamedex`,
      description,
      url,
      type: "profile",
      ...(profile.avatarUrl ? { images: [{ url: profile.avatarUrl }] } : {}),
    },
    twitter: {
      card: profile.avatarUrl ? "summary" : "summary",
      title: `${displayName} (@${profile.username}) | Gamedex`,
      description,
    },
  };
}

export default async function PublicProfilePage({ params }: PageProps) {
  const { username } = await params;
  const profile = await fetchPublicGamingProfile(username);

  if (!profile) {
    notFound();
  }

  return <PublicGamingProfileView profile={profile} />;
}
