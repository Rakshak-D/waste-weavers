import { NextResponse } from "next/server";
import { requireAuthenticatedUser } from "@/lib/auth/server";
import { getCustomerCustomOrder } from "@/lib/custom-orders/service";
export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) { try { const user = await requireAuthenticatedUser(); const item = await getCustomerCustomOrder(user.id, (await params).id); if (!item) return NextResponse.json({ message: "Custom request not found." }, { status: 404 }); return NextResponse.json(item); } catch { return NextResponse.json({ message: "Custom request could not be loaded." }, { status: 500 }); } }
