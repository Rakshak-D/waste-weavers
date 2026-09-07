import Link from "next/link";

import { CatalogueUnavailable } from "@/components/storefront/catalogue-unavailable";
import { StorefrontShell } from "@/components/storefront/storefront-shell";
import { getImpactSummary, type ImpactSummary } from "@/lib/storefront/catalogue";
import { formatMetricType } from "@/lib/storefront/presentation";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Impact — Waste Weavers",
  description: "Explore the explicit material and reuse metrics recorded across the Waste Weavers catalogue.",
};

export default async function ImpactPage() {
  let summary: ImpactSummary[] = [];
  let unavailable = false;
  try {
    summary = await getImpactSummary();
  } catch {
    unavailable = true;
  }

  return (
    <StorefrontShell>
      <main>
        <section className="border-b border-[#dfd2be] bg-[#eadfce]"><div className="mx-auto max-w-7xl px-5 pb-20 pt-20 sm:px-8 lg:pb-28 lg:pt-28"><p className="eyebrow">Impact, without the leap</p><h1 className="mt-5 max-w-4xl font-serif text-6xl leading-[0.94] tracking-[-0.04em] sm:text-8xl">Show the work.<br /><em className="text-[#6f4c2f]">Keep the numbers honest.</em></h1><p className="mt-8 max-w-2xl text-lg leading-8 text-[#68584a]">Waste Weavers stores explicit product-level impact metrics. This page adds them directly—using the original values and units, without inventing conversions.</p></div></section>
        <section className="mx-auto max-w-7xl px-5 py-24 sm:px-8">{unavailable ? <CatalogueUnavailable /> : summary.length === 0 ? <div className="border-y border-[#dfd2be] py-14 text-center"><p className="eyebrow">Impact record</p><h2 className="mt-3 font-serif text-3xl">Metrics will appear with the catalogue.</h2><p className="mt-3 text-sm text-[#68584a]">Connect the database and seed the demo catalogue to see explicit product-level records.</p></div> : <><div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">{summary.map((item) => <article key={`${item.metricType}-${item.unit}`} className="border-t-2 border-[#6b4b30] pt-5"><p className="eyebrow">{formatMetricType(item.metricType)}</p><p className="mt-4 font-serif text-5xl text-[#5f4630]">{item.total} <span className="text-2xl">{item.unit}</span></p><p className="mt-3 text-sm leading-6 text-[#68584a]">Sum of stored {item.unit} values across {item.productCount} active catalogue product{item.productCount === 1 ? "" : "s"}.</p></article>)}</div><p className="mt-12 max-w-2xl border-l-2 border-[#cdbb9f] pl-5 text-sm leading-6 text-[#68584a]">These are catalogue-level representations, not a claim of total business impact. The calculation is deterministic: values are grouped by metric type and unit, then summed exactly as stored.</p></>}</section>
        <section className="border-y border-[#dfd2be] bg-[#332a22] text-[#fffaf0]"><div className="mx-auto grid max-w-7xl gap-8 px-5 py-20 sm:px-8 lg:grid-cols-2 lg:items-end"><div><p className="eyebrow !text-[#d8b995]">Three dimensions</p><h2 className="mt-3 font-serif text-5xl">Material. Social. Circular.</h2></div><div className="grid gap-5 text-[#d9cabb] sm:grid-cols-3 lg:gap-8"><div><h3 className="font-serif text-2xl text-[#fffaf0]">Material</h3><p className="mt-2 text-sm leading-6">Recovered textile material is given a documented place in the product story.</p></div><div><h3 className="font-serif text-2xl text-[#fffaf0]">Social</h3><p className="mt-2 text-sm leading-6">Women-led SHG craftsmanship is part of how the work is made.</p></div><div><h3 className="font-serif text-2xl text-[#fffaf0]">Circular</h3><p className="mt-2 text-sm leading-6">Rental, return, and refurbishment keep future use in view.</p></div></div></div></section>
        <section className="border-b border-[#dfd2be] bg-[#eadfce]"><div className="mx-auto flex max-w-7xl flex-col gap-6 px-5 py-16 sm:px-8 md:flex-row md:items-center md:justify-between"><h2 className="font-serif text-4xl">Start with a piece, not a promise.</h2><Link href="/shop" className="w-fit rounded-full bg-[#5f4630] px-6 py-3.5 text-sm font-medium text-[#fffdf8]">Shop the collection</Link></div></section>
      </main>
    </StorefrontShell>
  );
}
