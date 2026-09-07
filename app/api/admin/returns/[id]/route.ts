import { NextResponse } from "next/server";
import { z } from "zod";
import { getAdminReturn, saveReturnInspection } from "@/lib/admin/lifecycle";
import { AdminServiceError } from "@/lib/admin/service";

const inspectionSchema = z.object({ inspections: z.array(z.object({ allocationId: z.string().min(1), condition: z.enum(["NOT_ASSESSED", "GOOD", "NEEDS_MAINTENANCE", "DAMAGED", "RETIRED"]), maintenanceType: z.enum(["INSPECTION", "CLEANING", "REPAIR", "REFURBISHMENT"]).nullable().optional(), notes: z.string().max(2000).nullable().optional() })).min(1) });

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) { try { return NextResponse.json(await getAdminReturn((await params).id)); } catch (error) { if (error instanceof AdminServiceError) return NextResponse.json({ message: error.message }, { status: 404 }); return NextResponse.json({ message: "Return could not be loaded." }, { status: 500 }); } }

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) { try { const parsed = inspectionSchema.safeParse(await request.json()); if (!parsed.success) return NextResponse.json({ message: "Inspection details are invalid." }, { status: 400 }); return NextResponse.json(await saveReturnInspection((await params).id, parsed.data.inspections)); } catch (error) { if (error instanceof AdminServiceError) return NextResponse.json({ code: error.code, message: error.message }, { status: error.code === "NOT_FOUND" ? 404 : 409 }); return NextResponse.json({ message: "Inspection could not be saved." }, { status: 500 }); } }
