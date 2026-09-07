import Link from "next/link";

import { StorefrontShell } from "@/components/storefront/storefront-shell";
import { ProductCard } from "@/components/storefront/product-card";
import { CatalogueUnavailable } from "@/components/storefront/catalogue-unavailable";
import { getFeaturedProducts, getImpactSummary, type CatalogueProduct, type ImpactSummary } from "@/lib/storefront/catalogue";
import { formatMetricType } from "@/lib/storefront/presentation";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Waste Weavers — Beautiful events, less waste",
  description: "Sustainable event décor made from upcycled textiles, available to rent or buy.",
};

const lifecycle = ["Textile waste", "Upcycling", "SHG craftsmanship", "Your event", "Return", "Refurbishment", "Re-rental / re-sale"];

export default async function HomePage() {
  let products: CatalogueProduct[] = [];
  let impact: ImpactSummary[] = [];
  let catalogueError = false;
  try {
    [products, impact] = await Promise.all([getFeaturedProducts(4), getImpactSummary()]);
  } catch {
    catalogueError = true;
  }
  const textileMetric = impact.find((item) => item.metricType === "TEXTILE_WASTE_DIVERTED");

  return (
    <StorefrontShell>
      <main>
        <section className="relative overflow-hidden border-b border-[#dfd2be]">
          <div className="mx-auto grid max-w-7xl gap-12 px-5 pb-24 pt-20 sm:px-8 lg:grid-cols-[1.05fr_0.95fr] lg:items-center lg:gap-20 lg:pb-32 lg:pt-28">
            <div>
              <p className="eyebrow">Event décor with a longer life</p>
              <h1 className="mt-6 max-w-2xl font-serif text-6xl leading-[0.95] tracking-[-0.04em] text-[#332a22] sm:text-8xl">Beautiful events.<br /><em className="text-[#6f4c2f]">Less waste.</em></h1>
              <p className="mt-8 max-w-xl text-lg leading-8 text-[#68584a]">Considered décor crafted from upcycled textiles—made to be celebrated, returned, and woven into the next gathering.</p>
              <div className="mt-10 flex flex-wrap gap-3">
                <Link href="/shop" className="rounded-full bg-[#5f4630] px-6 py-3.5 text-sm font-medium text-[#fffdf8] transition hover:bg-[#3f2d1f]">Shop collection</Link>
                <Link href="/shop?rent=true" className="rounded-full border border-[#6b4b30] px-6 py-3.5 text-sm font-medium text-[#5f4630] transition hover:bg-[#eadfce]">Explore rentals</Link>
              </div>
            </div>
            <div className="relative min-h-[420px] overflow-hidden bg-[#d8c5aa] lg:min-h-[540px]">
              <div className="absolute inset-0 bg-[linear-gradient(135deg,rgba(51,42,34,.08),transparent_55%)]" />
              <div className="absolute -right-16 top-10 h-72 w-72 rounded-full border-[28px] border-[#6f4c2f]/70 sm:h-96 sm:w-96" />
              <div className="absolute bottom-8 left-8 max-w-xs border-l-2 border-[#fffaf0] pl-5 text-[#fffaf0]"><p className="eyebrow !text-[#fffaf0]">A material story</p><p className="mt-3 font-serif text-3xl leading-tight">Every piece begins with something that could have been discarded.</p></div>
              <div className="absolute right-6 top-6 text-right text-xs uppercase tracking-[0.18em] text-[#6c4b30]">01 / 07<br />the weave continues</div>
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-5 py-24 sm:px-8">
          <div className="flex flex-wrap items-end justify-between gap-6"><div><p className="eyebrow">The collection</p><h2 className="mt-3 font-serif text-4xl sm:text-5xl">Made for the moment.<br /><span className="text-[#6f4c2f]">Ready for the next one.</span></h2></div><Link href="/shop" className="nav-link text-sm font-medium text-[#5f4630]">View all pieces <span aria-hidden="true">↗</span></Link></div>
          <div className="mt-12">{catalogueError ? <CatalogueUnavailable /> : products.length === 0 ? <p className="border-y border-[#dfd2be] py-10 text-[#68584a]">The collection is being prepared. Check back soon.</p> : <div className="grid gap-x-6 gap-y-14 sm:grid-cols-2 lg:grid-cols-4">{products.map((product) => <ProductCard key={product.id} product={product} />)}</div>}</div>
        </section>

        <section className="border-y border-[#dfd2be] bg-[#eadfce]">
          <div className="mx-auto grid max-w-7xl gap-8 px-5 py-20 sm:px-8 lg:grid-cols-2 lg:items-end"><div><p className="eyebrow">Two ways to gather</p><h2 className="mt-3 max-w-xl font-serif text-4xl sm:text-5xl">Choose what belongs in your story.</h2></div><p className="max-w-md text-base leading-7 text-[#68584a]">Keep the beauty moving, or make it yours. Both paths begin with the same care for materials and making.</p></div>
          <div className="mx-auto grid max-w-7xl border-t border-[#cdbb9f] sm:grid-cols-2">
            <div className="border-b border-[#cdbb9f] px-5 py-12 sm:border-b-0 sm:border-r sm:px-8"><span className="eyebrow">01 / Rent</span><h3 className="mt-5 font-serif text-4xl">Celebrate, then return.</h3><p className="mt-4 max-w-md leading-7 text-[#68584a]">Use reusable décor for your event without permanent ownership. The rental calendar and date-based availability arrive in the next phase.</p><Link href="/shop?rent=true" className="mt-7 inline-block text-sm font-medium text-[#5f4630] underline underline-offset-4">Browse rentable pieces ↗</Link></div>
            <div className="px-5 py-12 sm:px-8"><span className="eyebrow">02 / Buy</span><h3 className="mt-5 font-serif text-4xl">Keep the craft close.</h3><p className="mt-4 max-w-md leading-7 text-[#68584a]">Own a piece permanently and let it become part of more than one celebration, in your home or your event kit.</p><Link href="/shop?buy=true" className="mt-7 inline-block text-sm font-medium text-[#5f4630] underline underline-offset-4">Browse purchasable pieces ↗</Link></div>
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-5 py-24 sm:px-8"><div className="flex items-end justify-between gap-5"><div><p className="eyebrow">The circular lifecycle</p><h2 className="mt-3 max-w-2xl font-serif text-4xl sm:text-5xl">The celebration is one chapter.</h2></div><span className="hidden text-sm text-[#6f4c2f] sm:block">A longer life, by design.</span></div><div className="mt-12 overflow-x-auto pb-4" tabIndex={0} aria-label="Scrollable content"><div className="flex min-w-[900px] items-start">{lifecycle.map((step, index) => <div key={step} className="flex flex-1 items-start"><div className="min-w-0"><span className="text-xs text-[#6f4c2f]">0{index + 1}</span><div className="mt-3 h-3 w-3 rounded-full border-2 border-[#6b4b30] bg-[#f7f2e9]" /><p className="mt-4 max-w-[120px] text-sm leading-5 text-[#68584a]">{step}</p></div>{index < lifecycle.length - 1 && <div className="mt-[1.55rem] h-px flex-1 bg-[#cdbb9f]" />}</div>)}</div></div></section>

        <section className="bg-[#332a22] text-[#fffaf0]"><div className="mx-auto grid max-w-7xl gap-12 px-5 py-20 sm:px-8 lg:grid-cols-[1fr_1fr] lg:items-center"><div><p className="eyebrow !text-[#d8b995]">Meet the makers</p><h2 className="mt-4 max-w-xl font-serif text-5xl leading-tight">The hands behind the second life.</h2></div><div><p className="max-w-xl text-lg leading-8 text-[#d9cabb]">Waste Weavers is built around women-led self-help group craftsmanship. Textile recovery becomes considered, hand-finished décor through the skill and care of SHG artisans.</p><Link href="/about" className="mt-8 inline-block text-sm font-medium text-[#f0cda8] underline underline-offset-4">Read our story ↗</Link></div></div></section>

        <section className="mx-auto grid max-w-7xl gap-10 px-5 py-24 sm:px-8 lg:grid-cols-[1fr_1.2fr] lg:items-end"><div><p className="eyebrow">Impact, recorded honestly</p><h2 className="mt-3 max-w-xl font-serif text-4xl sm:text-5xl">What the catalogue can tell us.</h2><p className="mt-5 max-w-lg leading-7 text-[#68584a]">We show the explicit product metrics we have, with their original units. No inflated conversions—just a clearer view of materials kept in motion.</p><Link href="/impact" className="mt-7 inline-block text-sm font-medium text-[#5f4630] underline underline-offset-4">See the impact record ↗</Link></div><div className="grid gap-4 sm:grid-cols-2">{textileMetric ? <div className="border-t-2 border-[#6b4b30] pt-5"><p className="font-serif text-5xl text-[#5f4630]">{textileMetric.total} <span className="text-2xl">{textileMetric.unit}</span></p><p className="mt-2 text-sm text-[#68584a]">Textile waste represented across {textileMetric.productCount} active catalogue products.</p></div> : <div className="border-t-2 border-[#6b4b30] pt-5"><p className="font-serif text-3xl text-[#5f4630]">Metrics in progress</p><p className="mt-2 text-sm text-[#68584a]">Product-level impact records will appear here when the catalogue is connected.</p></div>}{impact.filter((item) => item.metricType !== "TEXTILE_WASTE_DIVERTED").slice(0, 1).map((item) => <div key={`${item.metricType}-${item.unit}`} className="border-t border-[#cdbb9f] pt-5"><p className="font-serif text-4xl text-[#5f4630]">{item.total} <span className="text-xl">{item.unit}</span></p><p className="mt-2 text-sm text-[#68584a]">{formatMetricType(item.metricType)} represented in active catalogue records.</p></div>)}</div></section>

        <section className="border-t border-[#dfd2be] bg-[#eadfce]"><div className="mx-auto flex max-w-7xl flex-col items-start justify-between gap-6 px-5 py-16 sm:px-8 md:flex-row md:items-center"><div><p className="eyebrow">Your next gathering</p><h2 className="mt-3 font-serif text-4xl">Find the piece that changes the room.</h2></div><Link href="/shop" className="rounded-full bg-[#5f4630] px-6 py-3.5 text-sm font-medium text-[#fffdf8] transition hover:bg-[#3f2d1f]">Shop the collection</Link></div></section>
      </main>
    </StorefrontShell>
  );
}
