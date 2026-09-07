import { NextResponse } from "next/server";
import { z } from "zod";
import { getAdminOrder, updateAdminOrderStatus, AdminServiceError } from "@/lib/admin/service";
import { AuthenticationRequiredError, AuthorizationDeniedError } from "@/lib/auth/server";
const schema = z.object({ status: z.enum(["DRAFT", "PENDING", "CONFIRMED", "FULFILLING", "COMPLETED", "CANCELLED"]) });
function failure(error: unknown) { if (error instanceof AuthenticationRequiredError) return NextResponse.json({ message: "Please sign in." }, { status: 401 }); if (error instanceof AuthorizationDeniedError) return NextResponse.json({ message: "Admin access is required." }, { status: 403 }); if (error instanceof AdminServiceError) return NextResponse.json({ code: error.code, message: error.message }, { status: error.code === "NOT_FOUND" ? 404 : 409 }); return NextResponse.json({ message: "Order operation failed." }, { status: 500 }); }
export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) { try { return NextResponse.json(await getAdminOrder((await params).id)); } catch (error) { return failure(error); } }
export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) { try { const parsed = schema.safeParse(await request.json()); if (!parsed.success) return NextResponse.json({ message: "Order status is invalid." }, { status: 400 }); return NextResponse.json(await updateAdminOrderStatus((await params).id, parsed.data.status)); } catch (error) { return failure(error); } }
