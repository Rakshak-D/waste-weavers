import { NextResponse } from "next/server";
import { z } from "zod";
import { updateMaintenanceRecord } from "@/lib/admin/lifecycle";
import { AdminServiceError } from "@/lib/admin/service";

const schema = z.object({ status: z.enum(["PENDING", "IN_PROGRESS", "COMPLETED", "CANCELLED"]), condition: z.enum(["NEW", "GOOD", "FAIR", "DAMAGED"]).optional(), notes: z.string().max(2000).nullable().optional() });
export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) { try { const parsed = schema.safeParse(await request.json()); if (!parsed.success) return NextResponse.json({ message: "Maintenance update is invalid." }, { status: 400 }); return NextResponse.json(await updateMaintenanceRecord((await params).id, parsed.data)); } catch (error) { if (error instanceof AdminServiceError) return NextResponse.json({ code: error.code, message: error.message }, { status: error.code === "NOT_FOUND" ? 404 : 409 }); return NextResponse.json({ message: "Maintenance record could not be updated." }, { status: 500 }); } }
