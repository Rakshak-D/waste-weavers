import { NextResponse } from "next/server";
import { z } from "zod";
import { replaceAdminProductImpactMetrics } from "@/lib/admin/impact";
import { AdminServiceError } from "@/lib/admin/service";

const schema = z.object({ metrics: z.array(z.object({ metricType: z.string().min(1), value: z.string().min(1), unit: z.string().min(1).max(32), description: z.string().max(500).nullable().optional() })).max(20) });
export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) { try { const parsed = schema.safeParse(await request.json()); if (!parsed.success) return NextResponse.json({ message: "Impact metrics are invalid." }, { status: 400 }); return NextResponse.json(await replaceAdminProductImpactMetrics((await params).id, parsed.data.metrics)); } catch (error) { if (error instanceof AdminServiceError) return NextResponse.json({ code: error.code, message: error.message }, { status: error.code === "NOT_FOUND" ? 404 : 422 }); return NextResponse.json({ message: "Impact metrics could not be saved." }, { status: 500 }); } }
