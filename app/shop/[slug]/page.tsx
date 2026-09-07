import Link from "next/link";
import { notFound } from "next/navigation";

import { CatalogueUnavailable } from "@/components/storefront/catalogue-unavailable";
import { AddToCartButton } from "@/components/storefront/add-to-cart-button";
import { ImageWithFallback } from "@/components/storefront/image-with-fallback";
import { RentalAvailabilityPicker } from "@/components/storefront/rental-availability-picker";
import { StorefrontShell } from "@/components/storefront/storefront-shell";
import { getProductBySlug } from "@/lib/storefront/catalogue";
import { formatMetricType, formatProductPrice, getRentalLabel } from "@/lib/storefront/presentation";

export const dynamic = "force-dynamic";

type ProductPageProps = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: ProductPageProps) {
  const { slug } = await params;
  try {
    const product = await getProductBySlug(slug);
    if (!product) return { title: "Piece not found — Waste Weavers" };
    return { title: `${product.name} — Waste Weavers`, description: product.shortDescription ?? product.description };
  } catch {
    return { title: "Waste Weavers collection" };
  }
}

export default async function ProductPage({ params }: ProductPageProps) {
  const { slug } = await params;
  let product;
  try {
    product = await getProductBySlug(slug);
  } catch {
    return <StorefrontShell><main className="mx-auto max-w-7xl px-5 py-16 sm:px-8"><CatalogueUnavailable /></main></StorefrontShell>;
  }
  if (!product) notFound();
  const purchasePrice = product.purchasable ? formatProductPrice(product.purchasePrice, product.currency) : null;

  return (
    <StorefrontShell>
      <main>
        <div className="mx-auto max-w-7xl px-5 py-8 text-sm text-[#665548] sm:px-8"><Link className="nav-link" href="/shop">Shop</Link><span className="mx-2">/</span><span>{product.category.name}</span></div>
        <section className="mx-auto grid max-w-7xl gap-12 px-5 pb-24 sm:px-8 lg:grid-cols-[1.1fr_0.9fr] lg:gap-20">
          <div className="grid gap-3 sm:grid-cols-2">{(product.images.length ? product.images : [{ id: "fallback", url: "/brand-textile.svg", altText: product.name, sortOrder: 0 }]).map((image, index) => <div key={image.id} className={`relative aspect-[4/3] overflow-hidden bg-[#e9dfcf] ${index === 0 && product.images.length > 1 ? "sm:col-span-2 sm:aspect-[16/9]" : ""}`}><ImageWithFallback src={image.url} alt={image.altText} fill priority={index === 0} sizes="(max-width: 640px) 100vw, 60vw" className="object-cover" /></div>)}</div>
          <div className="lg:pt-8"><p className="eyebrow">{product.category.name}</p><h1 className="mt-4 font-serif text-5xl leading-none tracking-[-0.035em] sm:text-6xl">{product.name}</h1><p className="mt-6 text-lg leading-8 text-[#68584a]">{product.description}</p><div className="mt-8 flex flex-wrap gap-2">{product.rentable && <span className="rounded-full border border-[#cdbb9f] px-3 py-1.5 text-xs font-medium uppercase tracking-[0.13em] text-[#6c4b30]">Rental available</span>}{product.purchasable && <span className="rounded-full border border-[#cdbb9f] px-3 py-1.5 text-xs font-medium uppercase tracking-[0.13em] text-[#6c4b30]">Purchase available</span>}</div>
            <div className="mt-10 border-y border-[#dfd2be] py-6">{product.purchasable && <div className="flex items-end justify-between gap-4"><div><p className="eyebrow">Own this piece</p><p className="mt-2 font-serif text-3xl text-[#5f4630]">{purchasePrice}</p></div><span className="text-sm text-[#665548]">One-time purchase</span></div>} {product.rentable && <div className={`${product.purchasable ? "mt-6 border-t border-[#dfd2be] pt-6" : ""}`}><div className="flex items-end justify-between gap-4"><div><p className="eyebrow">Bring it to your event</p><p className="mt-2 font-serif text-2xl text-[#5f4630]">{getRentalLabel(product.rentalPricingConfig)}</p></div><span className="text-right text-sm text-[#665548]">Date selection<br />below</span></div></div>}</div>
            {product.purchasable && <div className="mt-7"><AddToCartButton productId={product.id} itemType="PURCHASE" quantity={1} label="Add purchase to cart" /></div>}
            {product.rentable && <RentalAvailabilityPicker productId={product.id} currency={product.currency} rentalPricingConfig={product.rentalPricingConfig} />}
          </div>
        </section>
        <section className="border-y border-[#dfd2be] bg-[#eadfce]"><div className="mx-auto grid max-w-7xl gap-12 px-5 py-20 sm:px-8 lg:grid-cols-2"><div><p className="eyebrow">Material notes</p><h2 className="mt-3 font-serif text-4xl">Details worth knowing.</h2></div><dl className="grid gap-5 sm:grid-cols-2">{[["Material", product.material], ["Dimensions", product.dimensions], ["Weight", product.weight ? `${product.weight} kg` : null], ["Colour", product.color]].filter(([, value]) => value).map(([label, value]) => <div key={label} className="border-t border-[#cdbb9f] pt-3"><dt className="eyebrow">{label}</dt><dd className="mt-2 text-sm leading-6 text-[#5e4b3a]">{value}</dd></div>)}</dl></div></section>
        <section className="mx-auto grid max-w-7xl gap-12 px-5 py-24 sm:px-8 lg:grid-cols-[0.8fr_1.2fr]"><div><p className="eyebrow">The impact record</p><h2 className="mt-3 font-serif text-4xl">What this piece carries forward.</h2><p className="mt-5 leading-7 text-[#68584a]">These are the explicit product metrics currently recorded for this piece. Values are shown in their stored units.</p></div><div className="grid gap-4 sm:grid-cols-2">{product.impactMetrics.length ? product.impactMetrics.map((metric) => <div key={metric.id} className="border-t-2 border-[#6b4b30] pt-4"><p className="font-serif text-4xl text-[#5f4630]">{metric.value} <span className="text-xl">{metric.unit}</span></p><p className="mt-2 text-sm font-medium text-[#5e4b3a]">{formatMetricType(metric.metricType)}</p>{metric.description && <p className="mt-2 text-xs leading-5 text-[#665548]">{metric.description}</p>}</div>) : <p className="text-sm text-[#68584a]">No impact metrics have been recorded for this product yet.</p>}</div></section>
        <section className="bg-[#332a22] text-[#fffaf0]"><div className="mx-auto grid max-w-7xl gap-10 px-5 py-20 sm:px-8 lg:grid-cols-[1fr_1fr] lg:items-center"><div><p className="eyebrow !text-[#d8b995]">A longer life</p><h2 className="mt-3 font-serif text-5xl">Upcycled. Crafted. Reused.</h2></div><div><p className="leading-8 text-[#d9cabb]">This product begins with recovered textile material, moves through SHG craftsmanship, and is designed to return to use through rental, refurbishment, or future re-sale.</p><div className="mt-7 flex flex-wrap gap-x-5 gap-y-3 text-sm text-[#f0cda8]"><span>Upcycled</span><span aria-hidden="true">→</span><span>Crafted</span><span aria-hidden="true">→</span><span>Used</span><span aria-hidden="true">→</span><span>Returned</span><span aria-hidden="true">→</span><span>Reused</span></div></div></div></section>
      </main>
    </StorefrontShell>
  );
}
