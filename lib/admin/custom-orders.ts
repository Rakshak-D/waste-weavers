import { CustomOrderStatus, Prisma } from "@prisma/client";
import { requireAdmin } from "@/lib/auth/server";
import { prisma } from "@/lib/db/prisma";
import { canTransitionCustomOrderStatus, customOrderTransitionMessage } from "@/lib/admin/transitions";
import { CustomOrderServiceError } from "@/lib/custom-orders/service";

function pageValues(page = 1, pageSize = 25) { return { page: Math.max(1, page), pageSize: Math.min(100, Math.max(1, pageSize)) }; }

export async function getAdminCustomOrders(filters: { search?: string; status?: CustomOrderStatus; page?: number; pageSize?: number } = {}) {
  await requireAdmin(); const values = pageValues(filters.page, filters.pageSize); const search = filters.search?.trim();
  const where: Prisma.CustomOrderWhereInput = { ...(filters.status ? { status: filters.status } : {}), ...(search ? { OR: [{ id: { contains: search, mode: "insensitive" } }, { eventType: { contains: search, mode: "insensitive" } }, { customer: { name: { contains: search, mode: "insensitive" } } }, { customer: { email: { contains: search, mode: "insensitive" } } }] } : {}) };
  const [items, total] = await Promise.all([prisma.customOrder.findMany({ where, include: { customer: { select: { name: true, email: true } } }, orderBy: { createdAt: "desc" }, skip: (values.page - 1) * values.pageSize, take: values.pageSize }), prisma.customOrder.count({ where })]);
  return { items, total, page: values.page, pageSize: values.pageSize, pages: Math.ceil(total / values.pageSize) };
}

export async function getAdminCustomOrder(id: string) { await requireAdmin(); const item = await prisma.customOrder.findUnique({ where: { id }, include: { customer: { select: { id: true, name: true, email: true, phone: true } } } }); if (!item) throw new CustomOrderServiceError("NOT_FOUND", "Custom request not found."); return item; }

export async function updateAdminCustomOrder(id: string, input: { status: CustomOrderStatus; adminNotes?: string | null }) {
  await requireAdmin(); const current = await prisma.customOrder.findUnique({ where: { id }, select: { status: true } }); if (!current) throw new CustomOrderServiceError("NOT_FOUND", "Custom request not found."); if (!canTransitionCustomOrderStatus(current.status, input.status)) throw new CustomOrderServiceError("INVALID_STATE", customOrderTransitionMessage(current.status, input.status)); return prisma.customOrder.update({ where: { id }, data: { status: input.status, adminNotes: input.adminNotes?.trim() || null } });
}
