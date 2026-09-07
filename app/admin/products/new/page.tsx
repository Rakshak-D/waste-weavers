import { AdminPage, AdminShell } from "@/components/admin/admin-shell";
import { ProductForm } from "@/components/admin/admin-forms";
import { getAdminCategories } from "@/lib/admin/service";
import { requirePageAdmin } from "@/lib/auth/server";
export const dynamic = "force-dynamic";
export default async function NewProductPage() { const user = await requirePageAdmin(); const categories = await getAdminCategories(); return <AdminShell adminName={user.name ?? user.email}><AdminPage title="New product" description="Create a catalogue product. Rental configuration remains explicitly configurable."><div className="mt-8 max-w-4xl"><ProductForm categories={categories.map((category) => ({ id: category.id, name: category.name }))} /></div></AdminPage></AdminShell>; }

