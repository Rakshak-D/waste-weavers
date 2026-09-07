import Link from "next/link";

import { StorefrontShell } from "@/components/storefront/storefront-shell";

export const metadata = {
  title: "How it works — Waste Weavers",
  description: "See how Waste Weavers moves textile material from recovery to event décor and back into circulation.",
};

const steps = [
  ["01", "Recover", "Post-consumer textile waste is identified as a material worth carrying forward."],
  ["02", "Reimagine", "Design turns recovered material into décor for ceremonies, tables, and spaces."],
  ["03", "Craft", "Women-led SHG artisans bring the pieces to life through skilled making and finishing."],
  ["04", "Celebrate", "Customers choose to rent or purchase a piece for their event."],
  ["05", "Return", "Rented décor comes back after the event, ready for its next assessment."],
  ["06", "Renew", "Inspection, cleaning, repair, or refurbishment can prepare a piece for re-rental or re-sale."],
];

export default function HowItWorksPage() {
  return (
    <StorefrontShell>
      <main>
        <section className="border-b border-[#dfd2be] bg-[#eadfce]"><div className="mx-auto max-w-7xl px-5 pb-20 pt-20 sm:px-8 lg:pb-28 lg:pt-28"><p className="eyebrow">The circular route</p><h1 className="mt-5 max-w-4xl font-serif text-6xl leading-[0.94] tracking-[-0.04em] sm:text-8xl">A piece can keep<br /><em className="text-[#6f4c2f]">going.</em></h1><p className="mt-8 max-w-2xl text-lg leading-8 text-[#68584a]">Waste Weavers connects material recovery, SHG craftsmanship, event décor, and the work that happens after the celebration.</p></div></section>
        <section className="mx-auto max-w-7xl px-5 py-24 sm:px-8"><div className="grid border-t border-[#cdbb9f] md:grid-cols-2">{steps.map(([number, title, description]) => <article key={number} className="grid grid-cols-[3rem_1fr] gap-5 border-b border-[#cdbb9f] py-8 md:even:border-l md:even:pl-8"><span className="text-sm text-[#6f4c2f]">{number}</span><div><h2 className="font-serif text-3xl">{title}</h2><p className="mt-3 max-w-md leading-7 text-[#68584a]">{description}</p></div></article>)}</div></section>
        <section className="border-y border-[#dfd2be] bg-[#332a22] text-[#fffaf0]"><div className="mx-auto max-w-7xl px-5 py-20 sm:px-8"><p className="eyebrow !text-[#d8b995]">The promise</p><div className="mt-5 grid gap-10 lg:grid-cols-[1fr_1fr]"><h2 className="font-serif text-5xl leading-tight">Rent for the moment.<br />Return for the future.</h2><div><p className="text-lg leading-8 text-[#d9cabb]">The rental experience will eventually include date selection and inventory-aware availability. For now, explore the pieces and the material story behind them.</p><Link href="/shop" className="mt-8 inline-block text-sm font-medium text-[#f0cda8] underline underline-offset-4">Explore the collection ↗</Link></div></div></div></section>
      </main>
    </StorefrontShell>
  );
}
