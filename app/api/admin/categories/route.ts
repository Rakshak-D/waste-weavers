import { NextResponse } from "next/server";
import { z } from "zod";
import { createAdminCategory, getAdminCategories, AdminServiceError } from "@/lib/admin/service";
const schema = z.object({ name: z.string().min(1), slug: z.string().min(1), description: z.string().optional() });
function failure(error: unknown) { if (error instanceof AdminServiceError) return NextResponse.json({ code: error.code, message: error.message }, { status: 422 }); return NextResponse.json({ message: "Category operation failed." }, { status: 500 }); }
export async function GET() { try { return NextResponse.json(await getAdminCategories()); } catch (error) { return failure(error); } }
export async function POST(request: Request) { try { const parsed = schema.safeParse(await request.json()); if (!parsed.success) return NextResponse.json({ message: "Category details are invalid." }, { status: 400 }); return NextResponse.json(await createAdminCategory(parsed.data), { status: 201 }); } catch (error) { return failure(error); } }

