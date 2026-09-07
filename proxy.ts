import { NextResponse } from "next/server";

import { auth } from "@/auth";
import { canAccessAdmin } from "@/lib/auth/authorization-policy";

export const proxy = auth((request) => {
  const pathname = request.nextUrl.pathname;
  const user = request.auth?.user ?? null;
  const loginUrl = new URL("/login", request.nextUrl.origin);
  loginUrl.searchParams.set("callbackUrl", pathname);

  if (pathname.startsWith("/account") && !user) {
    return NextResponse.redirect(loginUrl);
  }

  if (pathname.startsWith("/admin") && !canAccessAdmin(user)) {
    if (!user) return NextResponse.redirect(loginUrl);
    return NextResponse.redirect(new URL("/account", request.nextUrl.origin));
  }

  return NextResponse.next();
});

export const config = {
  matcher: ["/account/:path*", "/admin/:path*"],
};
