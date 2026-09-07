import Link from "next/link";

import type { CatalogueProduct } from "@/lib/storefront/catalogue";
import { formatProductPrice, getRentalLabel } from "@/lib/storefront/presentation";
import { ImageWithFallback } from "@/components/storefront/image-with-fallback";

export function ProductCard({ product }: { product: CatalogueProduct }) {
  const image = product.images[0];
  const purchasePrice = product.purchasable ? formatProductPrice(product.purchasePrice, product.currency) : null;

  return (
    <article className="group">
      <Link href={`/shop/${product.slug}`} className="block focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#5f4630]">
        <div className="relative aspect-[4/3] overflow-hidden bg-[#e9dfcf]">
          <ImageWithFallback
            src={image?.url ?? "/brand-textile.svg"}
            alt={image?.altText ?? product.name}
            fill
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
            className="object-cover transition duration-700 ease-out group-hover:scale-[1.03]"
          />
          <div className="absolute left-4 top-4 flex gap-2">
            {product.rentable && <span className="badge">Rent</span>}
            {product.purchasable && <span className="badge">Buy</span>}
          </div>
        </div>
        <div className="pt-5">
          <p className="eyebrow">{product.category.name}</p>
          <h2 className="mt-2 font-serif text-2xl text-[#332a22]">{product.name}</h2>
          <p className="mt-2 line-clamp-2 text-sm leading-6 text-[#68584a]">{product.shortDescription ?? product.description}</p>
          <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm">
            {purchasePrice && <span className="font-medium text-[#5f4630]">{purchasePrice}</span>}
            {product.rentable && <span className="text-[#6b4b30]">{getRentalLabel(product.rentalPricingConfig)}</span>}
          </div>
          {product.impactMetrics.find((metric) => metric.metricType === "TEXTILE_WASTE_DIVERTED") && <p className="mt-3 text-xs text-[#6b4b30]">{product.impactMetrics.find((metric) => metric.metricType === "TEXTILE_WASTE_DIVERTED")?.value} {product.impactMetrics.find((metric) => metric.metricType === "TEXTILE_WASTE_DIVERTED")?.unit} textile waste represented</p>}
        </div>
      </Link>
    </article>
  );
}
