import { AccountFrame } from "@/components/account/account-ui";
import { AddressesClient } from "@/components/account/addresses-client";
import { getCustomerAddresses } from "@/lib/account/service";
import { requirePageUser } from "@/lib/auth/server";

export const dynamic = "force-dynamic";

export default async function AddressesPage() {
  const user = await requirePageUser("/account/addresses");
  let addresses: Awaited<ReturnType<typeof getCustomerAddresses>> = [];
  try { addresses = await getCustomerAddresses(user.id); } catch { addresses = []; }
  return <AccountFrame title="Saved addresses" intro="Manage delivery details for future orders. Historical order snapshots are not changed when you edit this list."><AddressesClient initialAddresses={addresses} /></AccountFrame>;
}
