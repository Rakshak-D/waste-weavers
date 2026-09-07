import { NextResponse } from "next/server";
import { getAdminRental, AdminServiceError } from "@/lib/admin/service";
export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) { try { return NextResponse.json(await getAdminRental((await params).id)); } catch (error) { if (error instanceof AdminServiceError) return NextResponse.json({ message: error.message }, { status: 404 }); return NextResponse.json({ message: "Rental could not be loaded." }, { status: 500 }); } }

