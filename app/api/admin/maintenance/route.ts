import { NextResponse } from "next/server";
import { z } from "zod";
import { createMaintenanceRecord, getAdminMaintenance } from "@/lib/admin/lifecycle";
import { AdminServiceError } from "@/lib/admin/service";

const schema = z.object({ inventoryUnitId: z.string().min(1), type: z.enum(["INSPECTION", "CLEANING", "REPAIR", "REFURBISHMENT"]), description: z.string().max(2000).nullable().optional(), notes: z.string().max(2000).nullable().optional() });

export async function GET(request: Request) { try { const status = new URL(request.url).searchParams.get("status") as "PENDING" | "IN_PROGRESS" | "COMPLETED" | "CANCELLED" | null; return NextResponse.json(await getAdminMaintenance(status ?? undefined)); } catch { return NextResponse.json({ message: "Maintenance records could not be loaded." }, { status: 500 }); } }
export async function POST(request: Request) { try { const parsed = schema.safeParse(await request.json()); if (!parsed.success) return NextResponse.json({ message: "Maintenance details are invalid." }, { status: 400 }); return NextResponse.json(await createMaintenanceRecord(parsed.data)); } catch (error) { if (error instanceof AdminServiceError) return NextResponse.json({ code: error.code, message: error.message }, { status: error.code === "NOT_FOUND" ? 404 : 409 }); return NextResponse.json({ message: "Maintenance record could not be created." }, { status: 500 }); } }
