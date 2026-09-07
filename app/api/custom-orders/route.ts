import { NextResponse } from "next/server";
import { z } from "zod";
import { requireAuthenticatedUser } from "@/lib/auth/server";
import { createCustomOrderRequest, getCustomerCustomOrders, CustomOrderServiceError } from "@/lib/custom-orders/service";

const schema = z.object({ eventType: z.string().min(1).max(80), eventDate: z.string().nullable().optional(), guestCount: z.number().int().positive().nullable().optional(), requirements: z.string().min(10).max(5000), budget: z.string().nullable().optional(), referenceFileUrl: z.string().max(2048).nullable().optional() });
export async function GET() { try { const user = await requireAuthenticatedUser(); return NextResponse.json(await getCustomerCustomOrders(user.id)); } catch { return NextResponse.json({ message: "Custom requests could not be loaded." }, { status: 500 }); } }
export async function POST(request: Request) { try { const user = await requireAuthenticatedUser(); const parsed = schema.safeParse(await request.json()); if (!parsed.success) return NextResponse.json({ message: "Please check the request details." }, { status: 400 }); return NextResponse.json(await createCustomOrderRequest(user.id, parsed.data), { status: 201 }); } catch (error) { if (error instanceof CustomOrderServiceError) return NextResponse.json({ code: error.code, message: error.message }, { status: 422 }); return NextResponse.json({ message: "Custom request could not be submitted." }, { status: 500 }); } }
