import { NextResponse } from "next/server";
import { getAdminRentals, AdminServiceError } from "@/lib/admin/service";
export async function GET(request: Request) { try { const url = new URL(request.url); return NextResponse.json(await getAdminRentals({ status: (url.searchParams.get("status") as "PENDING" | "RESERVED" | "ACTIVE" | "RETURN_PENDING" | "COMPLETED" | "CANCELLED" | null) ?? undefined, group: (url.searchParams.get("group") as "upcoming" | "active" | "completed" | "cancelled" | null) ?? undefined, page: Number(url.searchParams.get("page") ?? 1) })); } catch (error) { if (error instanceof AdminServiceError) return NextResponse.json({ message: error.message }, { status: 422 }); return NextResponse.json({ message: "Rentals could not be loaded." }, { status: 500 }); } }

