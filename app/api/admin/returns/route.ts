import { NextResponse } from "next/server";
import { z } from "zod";
import { getAdminReturns, getAdminReturnsAwaitingAction, receiveRentalReturn } from "@/lib/admin/lifecycle";
import { AdminServiceError } from "@/lib/admin/service";
import { AuthenticationRequiredError, AuthorizationDeniedError } from "@/lib/auth/server";

const receiveSchema = z.object({ rentalId: z.string().min(1), notes: z.string().max(2000).nullable().optional() });

export async function GET(request: Request) {
  try { const status = new URL(request.url).searchParams.get("status") as "EXPECTED" | "RECEIVED" | "INSPECTION_REQUIRED" | "PROCESSED" | "CANCELLED" | null; return NextResponse.json(status ? await getAdminReturns(status) : await getAdminReturnsAwaitingAction()); }
  catch (error) { if (error instanceof AuthenticationRequiredError) return NextResponse.json({ message: "Please sign in." }, { status: 401 }); if (error instanceof AuthorizationDeniedError) return NextResponse.json({ message: "Admin access is required." }, { status: 403 }); return NextResponse.json({ message: "Returns could not be loaded." }, { status: 500 }); }
}

export async function POST(request: Request) {
  try { const parsed = receiveSchema.safeParse(await request.json()); if (!parsed.success) return NextResponse.json({ message: "Return details are invalid." }, { status: 400 }); return NextResponse.json(await receiveRentalReturn(parsed.data.rentalId, parsed.data.notes)); }
  catch (error) { if (error instanceof AuthenticationRequiredError) return NextResponse.json({ message: "Please sign in." }, { status: 401 }); if (error instanceof AuthorizationDeniedError) return NextResponse.json({ message: "Admin access is required." }, { status: 403 }); if (error instanceof AdminServiceError) return NextResponse.json({ code: error.code, message: error.message }, { status: error.code === "NOT_FOUND" ? 404 : 409 }); return NextResponse.json({ message: "Return could not be received." }, { status: 500 }); }
}
