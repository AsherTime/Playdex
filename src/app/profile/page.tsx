import { GamingHistorySection } from "@/components/profile/GamingHistorySection";
import { ProfileForm } from "@/components/auth/ProfileForm";
import { getServerUser } from "@/lib/auth-server-helpers";
import { getServerGamingHistory } from "@/lib/gaming-stats";

export default async function ProfilePage() {
  const user = await getServerUser();
  const history = user ? await getServerGamingHistory(user.id) : [];

  return (
    <div className="mx-auto max-w-2xl space-y-5">
      <ProfileForm />
      {user ? <GamingHistorySection history={history} /> : null}
    </div>
  );
}
