import { NextResponse } from "next/server";
import { getAdminInventoryLifecycle } from "@/lib/admin/lifecycle";
import { AdminServiceError } from "@/lib/admin/service";
export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) { try { return NextResponse.json(await getAdminInventoryLifecycle((await params).id)); } catch (error) { if (error instanceof AdminServiceError) return NextResponse.json({ message: error.message }, { status: 404 }); return NextResponse.json({ message: "Inventory history could not be loaded." }, { status: 500 }); } }
