import { NextResponse } from "next/server";

import { prisma } from "@/lib/db/prisma";
import { hashPassword } from "@/lib/auth/password";
import { normalizeEmail, registrationSchema } from "@/lib/auth/schemas";
import { roleForRegistration } from "@/lib/auth/authorization-policy";

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ message: "Invalid request." }, { status: 400 });
  }

  const parsed = registrationSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { message: parsed.error.issues[0]?.message ?? "Invalid registration details." },
      { status: 400 },
    );
  }

  const email = normalizeEmail(parsed.data.email);
  const passwordHash = await hashPassword(parsed.data.password);

  try {
    await prisma.user.create({
      data: {
        name: parsed.data.name,
        email,
        passwordHash,
        role: roleForRegistration(),
      },
    });
  } catch {
    // Keep uniqueness/database details out of the public response.
    return NextResponse.json(
      { message: "Unable to create an account with those details." },
      { status: 400 },
    );
  }

  return NextResponse.json({ message: "Account created." }, { status: 201 });
}
