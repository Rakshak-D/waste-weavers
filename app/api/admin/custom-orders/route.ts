import { NextResponse } from "next/server";
import { z } from "zod";
import { getAdminCustomOrders } from "@/lib/admin/custom-orders";
const schema = z.object({ search: z.string().optional(), status: z.enum(["REQUESTED", "UNDER_REVIEW", "QUOTED", "APPROVED", "IN_PROGRESS", "COMPLETED", "CANCELLED"]).optional(), page: z.coerce.number().int().positive().optional() });
export async function GET(request: Request) { try { const query = Object.fromEntries(new URL(request.url).searchParams.entries()); const parsed = schema.safeParse(query); if (!parsed.success) return NextResponse.json({ message: "Custom request filters are invalid." }, { status: 400 }); return NextResponse.json(await getAdminCustomOrders(parsed.data)); } catch { return NextResponse.json({ message: "Custom requests could not be loaded." }, { status: 500 }); } }
