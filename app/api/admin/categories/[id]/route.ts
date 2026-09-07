import { NextResponse } from "next/server";
import { z } from "zod";
import { updateAdminCategory, AdminServiceError } from "@/lib/admin/service";
const schema = z.object({ name: z.string().min(1), slug: z.string().min(1), description: z.string().optional() });
export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) { try { const parsed = schema.safeParse(await request.json()); if (!parsed.success) return NextResponse.json({ message: "Category details are invalid." }, { status: 400 }); return NextResponse.json(await updateAdminCategory((await params).id, parsed.data)); } catch (error) { if (error instanceof AdminServiceError) return NextResponse.json({ message: error.message }, { status: 422 }); return NextResponse.json({ message: "Category could not be updated." }, { status: 500 }); } }

