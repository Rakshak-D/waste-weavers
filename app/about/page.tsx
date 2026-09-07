import Link from "next/link";

import { StorefrontShell } from "@/components/storefront/storefront-shell";

export const metadata = {
  title: "About Waste Weavers",
  description: "The story behind Waste Weavers: recovered textiles, SHG craftsmanship, and reusable event décor.",
};

export default function AboutPage() {
  return (
    <StorefrontShell>
      <main>
        <section className="border-b border-[#dfd2be] bg-[#eadfce]"><div className="mx-auto max-w-7xl px-5 pb-20 pt-20 sm:px-8 lg:pb-28 lg:pt-28"><p className="eyebrow">About Waste Weavers</p><h1 className="mt-5 max-w-4xl font-serif text-6xl leading-[0.94] tracking-[-0.04em] sm:text-8xl">A celebration can be beautiful <em className="text-[#6f4c2f]">and</em> responsible.</h1><p className="mt-8 max-w-2xl text-lg leading-8 text-[#68584a]">Waste Weavers is a circular event décor concept built around one simple shift: let the materials, makers, and pieces have more than one life.</p></div></section>
        <section className="mx-auto grid max-w-7xl gap-12 px-5 py-24 sm:px-8 lg:grid-cols-[0.8fr_1.2fr]"><div><p className="eyebrow">The idea</p><h2 className="mt-3 font-serif text-4xl">From post-consumer textile waste to considered décor.</h2></div><div className="space-y-6 text-lg leading-8 text-[#68584a]"><p>Textile waste is recovered and reimagined as reusable décor for weddings, celebrations, and meaningful gatherings. The result is not disposable styling, but a collection designed to return to circulation.</p><p>The platform brings together two ways to participate: rent a piece for your event, or purchase it to keep. Whichever path a customer chooses, the work begins with the same respect for material and making.</p></div></section>
        <section className="border-y border-[#dfd2be] bg-[#332a22] text-[#fffaf0]"><div className="mx-auto grid max-w-7xl gap-12 px-5 py-20 sm:px-8 lg:grid-cols-2 lg:items-center"><div><p className="eyebrow !text-[#d8b995]">The makers</p><h2 className="mt-3 font-serif text-5xl">Craftsmanship is part of the product.</h2></div><p className="max-w-xl text-lg leading-8 text-[#d9cabb]">Women-led self-help groups bring skill and care to each transformation. Waste Weavers is designed to make that craftsmanship visible as part of the circular story, without reducing it to a footnote.</p></div></section>
        <section className="mx-auto grid max-w-7xl gap-10 px-5 py-24 sm:px-8 md:grid-cols-3"><div><p className="eyebrow">01</p><h2 className="mt-3 font-serif text-3xl">Recover</h2><p className="mt-3 leading-7 text-[#68584a]">Post-consumer textiles become the starting material for a new event object.</p></div><div><p className="eyebrow">02</p><h2 className="mt-3 font-serif text-3xl">Make</h2><p className="mt-3 leading-7 text-[#68584a]">SHG artisans shape, stitch, and finish pieces with their own practical knowledge.</p></div><div><p className="eyebrow">03</p><h2 className="mt-3 font-serif text-3xl">Move on</h2><p className="mt-3 leading-7 text-[#68584a]">After an event, a piece can return for inspection and refurbishment before its next chapter.</p></div></section>
        <section className="border-t border-[#dfd2be] bg-[#eadfce]"><div className="mx-auto flex max-w-7xl flex-col gap-6 px-5 py-16 sm:px-8 md:flex-row md:items-center md:justify-between"><h2 className="font-serif text-4xl">See what is ready for its next celebration.</h2><Link href="/shop" className="w-fit rounded-full bg-[#5f4630] px-6 py-3.5 text-sm font-medium text-[#fffdf8]">Shop the collection</Link></div></section>
      </main>
    </StorefrontShell>
  );
}
