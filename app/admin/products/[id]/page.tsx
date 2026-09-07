import Link from "next/link";
import { AdminPage, AdminShell } from "@/components/admin/admin-shell";
import { ProductForm } from "@/components/admin/admin-forms";
import { ImpactMetricsEditor } from "@/components/admin/impact-metrics-editor";
import { getAdminCategories, getAdminProduct } from "@/lib/admin/service";
import { requirePageAdmin } from "@/lib/auth/server";
export const dynamic = "force-dynamic";
export default async function EditProductPage({ params }: { params: Promise<{ id: string }> }) { const user = await requirePageAdmin(); const id = (await params).id; const [product, categories] = await Promise.all([getAdminProduct(id), getAdminCategories()]); return <AdminShell adminName={user.name ?? user.email}><AdminPage title={`Edit ${product.name}`} description="Update catalogue data without changing historical order or impact snapshots."><div className="mt-8 max-w-4xl"><ProductForm productId={product.id} categories={categories.map((category) => ({ id: category.id, name: category.name }))} initial={product as unknown as Record<string, unknown>} /><ImpactMetricsEditor productId={product.id} initial={product.impactMetrics.map((metric) => ({ metricType: metric.metricType, value: metric.value.toString(), unit: metric.unit, description: metric.description ?? "" }))} /><Link href="/admin/products" className="mt-5 inline-block text-sm text-[#5f4630] underline underline-offset-4">Back to products</Link></div></AdminPage></AdminShell>; }
