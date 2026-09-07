import Link from "next/link";

export function SiteFooter() {
  return (
    <footer className="border-t border-[#dfd2be] bg-[#e9dfcf] text-[#5e4b3a]">
      <div className="mx-auto grid max-w-7xl gap-10 px-5 py-14 sm:px-8 md:grid-cols-[1.6fr_1fr_1fr]">
        <div>
          <p className="font-serif text-2xl text-[#332a22]">Waste Weavers</p>
          <p className="mt-3 max-w-sm text-sm leading-6">Event décor with a longer life—made from recovered textiles, crafted with care, and designed to return to circulation.</p>
        </div>
        <div>
          <p className="eyebrow">Explore</p>
          <div className="mt-4 grid gap-2 text-sm"><Link className="nav-link" href="/shop">Shop</Link><Link className="nav-link" href="/how-it-works">How it works</Link><Link className="nav-link" href="/about">About</Link><Link className="nav-link" href="/impact">Impact</Link></div>
        </div>
        <div>
          <p className="eyebrow">Your space</p>
          <div className="mt-4 grid gap-2 text-sm"><Link className="nav-link" href="/account">Account</Link><Link className="nav-link" href="/cart">Cart</Link><span className="mt-2 text-xs uppercase tracking-[0.15em] text-[#665548]">Prototype demo · no live support channel</span></div>
        </div>
      </div>
      <div className="mx-auto max-w-7xl border-t border-[#d4c5af] px-5 py-5 text-xs text-[#665548] sm:px-8">A circular event décor concept for SIH 2026.</div>
    </footer>
  );
}
