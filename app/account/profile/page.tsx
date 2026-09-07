import { AccountFrame } from "@/components/account/account-ui";
import { ProfileForm } from "@/components/account/profile-form";
import { getCustomerProfile } from "@/lib/account/service";
import { requirePageUser } from "@/lib/auth/server";

export const dynamic = "force-dynamic";

export default async function ProfilePage() {
  const user = await requirePageUser("/account/profile");
  const profile = await getCustomerProfile(user.id);
  return <AccountFrame title="Your profile" intro="Keep your basic account details current. Email changes are intentionally not available yet."><ProfileForm profile={profile ?? { name: user.name ?? null, email: user.email, phone: null }} /></AccountFrame>;
}

