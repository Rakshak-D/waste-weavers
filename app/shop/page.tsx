import Link from "next/link";

import { CatalogueUnavailable } from "@/components/storefront/catalogue-unavailable";
import { ProductCard } from "@/components/storefront/product-card";
import { StorefrontShell } from "@/components/storefront/storefront-shell";
import { getCategories, getProducts, type CatalogueProduct, type CatalogueSort } from "@/lib/storefront/catalogue";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Shop the collection — Waste Weavers",
  description: "Browse sustainable event décor made from upcycled textiles. Rent or buy pieces for your next gathering.",
};

type ShopSearchParams = Record<string, string | string[] | undefined>;

function first(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

export default async function ShopPage({ searchParams }: { searchParams: Promise<ShopSearchParams> }) {
  const query = await searchParams;
  const category = first(query.category);
  const search = first(query.q);
  const sortValue = first(query.sort);
  const sort: CatalogueSort = sortValue === "price-asc" || sortValue === "price-desc" || sortValue === "newest" ? sortValue : "featured";
  const mode = first(query.mode);
  const purchaseOnly = mode === "buy" || first(query.buy) === "true" || first(query.purchase) === "true";
  const rentalOnly = mode === "rent" || first(query.rent) === "true" || first(query.rental) === "true";

  let products: CatalogueProduct[] = [];
  let categories: { name: string; slug: string }[] = [];
  let catalogueError = false;
  try {
    [products, categories] = await Promise.all([
      getProducts({ category, search, purchaseOnly, rentalOnly, sort }),
      getCategories(),
    ]);
  } catch {
    catalogueError = true;
  }

  const queryForLinks = new URLSearchParams();
  if (search) queryForLinks.set("q", search);
  if (sort !== "featured") queryForLinks.set("sort", sort);

  return (
    <StorefrontShell>
      <main>
        <section className="border-b border-[#dfd2be] bg-[#eadfce]"><div className="mx-auto max-w-7xl px-5 pb-14 pt-16 sm:px-8"><p className="eyebrow">The collection</p><h1 className="mt-4 max-w-3xl font-serif text-6xl leading-none tracking-[-0.04em] sm:text-8xl">Décor with<br /><em className="text-[#6f4c2f]">a second life.</em></h1><p className="mt-7 max-w-xl text-lg leading-8 text-[#68584a]">Pieces for ceremonies, tables, and spaces—crafted from recovered textiles and made to move between celebrations.</p></div></section>
        <section className="mx-auto max-w-7xl px-5 py-12 sm:px-8">
          <form method="get" className="grid gap-4 border-y border-[#dfd2be] py-5 lg:grid-cols-[1.4fr_1fr_1fr_1fr_auto] lg:items-end">
            <label className="block text-sm font-medium text-[#5e4b3a]">Search<input name="q" defaultValue={search} placeholder="Search textiles, backdrops…" className="mt-2 w-full border-b border-[#b8a78f] bg-transparent px-0 py-2 outline-none placeholder:text-[#9b8c7b] focus:border-[#5f4630]" /></label>
            <label className="block text-sm font-medium text-[#5e4b3a]">Category<select name="category" defaultValue={category ?? ""} className="mt-2 w-full border-b border-[#b8a78f] bg-transparent px-0 py-2 outline-none focus:border-[#5f4630]"><option value="">All categories</option>{categories.map((item) => <option key={item.slug} value={item.slug}>{item.name}</option>)}</select></label>
            <label className="block text-sm font-medium text-[#5e4b3a]">Availability<select name="mode" defaultValue={purchaseOnly ? "buy" : rentalOnly ? "rent" : "all"} className="mt-2 w-full border-b border-[#b8a78f] bg-transparent px-0 py-2 outline-none focus:border-[#5f4630]"><option value="all">Rent or buy</option><option value="buy">Buyable pieces</option><option value="rent">Rentable pieces</option></select></label>
            <label className="block text-sm font-medium text-[#5e4b3a]">Sort<select name="sort" defaultValue={sort} className="mt-2 w-full border-b border-[#b8a78f] bg-transparent px-0 py-2 outline-none focus:border-[#5f4630]"><option value="featured">Recommended</option><option value="price-asc">Price: low to high</option><option value="price-desc">Price: high to low</option><option value="newest">Newest</option></select></label>
            <button type="submit" className="rounded-full bg-[#5f4630] px-5 py-2.5 text-sm font-medium text-[#fffdf8] transition hover:bg-[#3f2d1f]">Apply</button>
          </form>
          <div className="mt-6 flex flex-wrap items-center gap-3 text-sm"><span className="text-[#665548]">Browse by:</span><Link className={`filter-pill ${!category ? "filter-pill-active" : ""}`} href={`/shop?${queryForLinks.toString()}`}>All</Link>{categories.map((item) => { const params = new URLSearchParams(queryForLinks); params.set("category", item.slug); return <Link key={item.slug} className={`filter-pill ${category === item.slug ? "filter-pill-active" : ""}`} href={`/shop?${params.toString()}`}>{item.name}</Link>; })}<Link className={`filter-pill ${rentalOnly ? "filter-pill-active" : ""}`} href={`/shop?${new URLSearchParams({ ...Object.fromEntries(queryForLinks), rent: "true" }).toString()}`}>Rent</Link><Link className={`filter-pill ${purchaseOnly ? "filter-pill-active" : ""}`} href={`/shop?${new URLSearchParams({ ...Object.fromEntries(queryForLinks), buy: "true" }).toString()}`}>Buy</Link></div>
          <div className="mt-12">{catalogueError ? <CatalogueUnavailable /> : products.length === 0 ? <div className="border-y border-[#dfd2be] py-16 text-center"><p className="eyebrow">No pieces found</p><h2 className="mt-3 font-serif text-3xl">Try a different search.</h2><p className="mt-3 text-sm text-[#68584a]">Clear a filter or search by a material, category, or product name.</p><Link className="mt-6 inline-block text-sm font-medium text-[#5f4630] underline underline-offset-4" href="/shop">Clear filters</Link></div> : <><p className="mb-8 text-sm text-[#665548]">{products.length} {products.length === 1 ? "piece" : "pieces"}</p><div className="grid gap-x-6 gap-y-14 sm:grid-cols-2 lg:grid-cols-3">{products.map((product) => <ProductCard key={product.id} product={product} />)}</div></>}</div>
        </section>
      </main>
    </StorefrontShell>
  );
}
