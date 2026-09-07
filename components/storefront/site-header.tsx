import Link from "next/link";

import { getCurrentUser } from "@/lib/auth/server";

export async function SiteHeader() {
  let user = null;
  try {
    user = await getCurrentUser();
  } catch {
    // The navigation stays usable while the database is unavailable.
  }

  return (
    <header className="border-b border-[#dfd2be] bg-[#f7f2e9]/95 backdrop-blur">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-5 sm:px-8">
        <Link href="/" className="group flex items-center gap-3" aria-label="Waste Weavers home">
          <span className="flex h-9 w-9 items-center justify-center rounded-full border border-[#6f4c2f] text-xs font-semibold tracking-tight text-[#6c4b30]">WW</span>
          <span className="font-serif text-xl tracking-tight text-[#332a22]">Waste Weavers</span>
        </Link>
        <nav className="hidden items-center gap-7 text-sm text-[#68584a] md:flex" aria-label="Primary navigation">
          <Link className="nav-link" href="/shop">Shop</Link>
          <Link className="nav-link" href="/how-it-works">How it works</Link>
          <Link className="nav-link" href="/about">About</Link>
          <Link className="nav-link" href="/impact">Impact</Link>
          <Link className="nav-link" href="/custom-order">Custom décor</Link>
        </nav>
        <div className="hidden items-center gap-4 text-sm md:flex">
          <Link className="nav-link" href={user ? "/cart" : "/login?callbackUrl=/cart"}>Cart</Link>
          {user?.role === "ADMIN" && <Link className="nav-link" href="/admin">Admin</Link>}
          <Link className="rounded-full border border-[#6b4b30] px-4 py-2 font-medium text-[#5f4630] transition hover:bg-[#5f4630] hover:text-[#fffdf8]" href={user ? "/account" : "/login"}>
            {user ? "Account" : "Login"}
          </Link>
        </div>
        <details className="relative md:hidden">
          <summary className="cursor-pointer list-none rounded-full border border-[#6b4b30] px-4 py-2 text-sm font-medium text-[#5f4630] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#5f4630]">Menu</summary>
          <nav className="absolute right-0 z-20 mt-3 grid min-w-52 gap-1 border border-[#dfd2be] bg-[#fffdf8] p-3 text-sm shadow-xl" aria-label="Mobile navigation">
            <Link className="mobile-nav-link" href="/shop">Shop</Link>
            <Link className="mobile-nav-link" href="/how-it-works">How it works</Link>
            <Link className="mobile-nav-link" href="/about">About</Link>
            <Link className="mobile-nav-link" href="/impact">Impact</Link>
            <Link className="mobile-nav-link" href="/custom-order">Custom décor</Link>
            <Link className="mobile-nav-link" href={user ? "/cart" : "/login?callbackUrl=/cart"}>Cart</Link>
            {user?.role === "ADMIN" && <Link className="mobile-nav-link" href="/admin">Admin</Link>}
            <Link className="mobile-nav-link border-t border-[#dfd2be] pt-3" href={user ? "/account" : "/login"}>{user ? "Account" : "Login"}</Link>
          </nav>
        </details>
      </div>
    </header>
  );
}
