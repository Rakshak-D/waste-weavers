import { PrismaClient, UserRole } from "@prisma/client";
import { hashPassword } from "../lib/auth/password";
import { DEMO_RENTAL_PRICING } from "../config/business-rules";

const prisma = new PrismaClient();

const categories = [
  {
    name: "Backdrops & Panels",
    slug: "backdrops-panels",
    description: "Statement backdrops and textile panels for ceremonies and receptions.",
  },
  {
    name: "Table Décor",
    slug: "table-decor",
    description: "Reusable table runners, mats, and coordinated table-setting accents.",
  },
  {
    name: "Hanging Installations",
    slug: "hanging-installations",
    description: "Lightweight textile installations for warm, memorable event spaces.",
  },
];

const products = [
  {
    name: "Mitti Patchwork Backdrop",
    slug: "mitti-patchwork-backdrop",
    categorySlug: "backdrops-panels",
    shortDescription: "A richly textured backdrop woven from recovered post-consumer textiles.",
    description:
      "The Mitti Patchwork Backdrop brings earthy depth to a ceremony or reception wall through layered textile offcuts and women-led SHG craftsmanship. Demo catalogue data for Phase 1.",
    purchasePrice: "18500.00",
    material: "Upcycled cotton and blended textile offcuts",
    dimensions: "240 cm × 180 cm",
    weight: "8.200",
    color: "Terracotta, sand, and natural cream",
    images: [
      ["/brand-textile.svg", "Mitti Patchwork Backdrop in warm earth tones"],
      ["/brand-textile.svg", "Close detail of the patchwork textile surface"],
    ],
    units: 3,
    codePrefix: "WW-MPB",
    impact: [
      ["TEXTILE_WASTE_DIVERTED", "4.8", "kg", "Demo estimate recorded as an explicit product metric."],
      ["REUSE_CYCLES_TARGET", "40", "cycles", "Demo lifecycle target; methodology to be defined later."],
    ],
  },
  {
    name: "Saanjh Table Setting Set",
    slug: "saanjh-table-setting-set",
    categorySlug: "table-decor",
    shortDescription: "A coordinated set of reusable textile accents for an intimate tablescape.",
    description:
      "Saanjh pairs hand-finished runners and textile place accents in a softly layered palette. Demo catalogue data for Phase 1.",
    purchasePrice: "6200.00",
    material: "Upcycled cotton, linen remnants, and natural-dye accents",
    dimensions: "Set of 8 place accents and 1 runner",
    weight: "2.100",
    color: "Indigo, oat, and muted rose",
    images: [
      ["/brand-textile.svg", "Saanjh textile table setting set"],
      ["/brand-textile.svg", "Layered fabric detail from the table setting"],
    ],
    units: 5,
    codePrefix: "WW-STS",
    impact: [["TEXTILE_WASTE_DIVERTED", "1.7", "kg", "Demo estimate recorded as an explicit product metric."]],
  },
  {
    name: "Aangan Wedding Welcome Décor",
    slug: "aangan-wedding-welcome-decor",
    categorySlug: "backdrops-panels",
    shortDescription: "A welcoming textile décor composition for the entrance to a celebration.",
    description:
      "Aangan combines a reusable welcome banner, layered fabric pennants, and hand-stitched details for wedding entrances. Demo catalogue data for Phase 1.",
    purchasePrice: "9800.00",
    material: "Recovered sari textiles and cotton canvas remnants",
    dimensions: "300 cm wide installation",
    weight: "3.400",
    color: "Marigold, berry, and warm off-white",
    images: [["/brand-textile.svg", "Aangan wedding welcome décor composition"]],
    units: 4,
    codePrefix: "WW-AWD",
    impact: [["TEXTILE_WASTE_DIVERTED", "2.9", "kg", "Demo estimate recorded as an explicit product metric."]],
  },
  {
    name: "Leher Textile Canopy",
    slug: "leher-textile-canopy",
    categorySlug: "hanging-installations",
    shortDescription: "A reusable hanging canopy that softens large event spaces with textile movement.",
    description:
      "Leher creates a flowing ceiling moment from reclaimed fabric strips and modular hanging sections. Demo catalogue data for Phase 1.",
    purchasePrice: "24000.00",
    material: "Upcycled cotton and polyester textile strips",
    dimensions: "350 cm × 250 cm modular canopy",
    weight: "6.600",
    color: "Natural cream, clay, and cocoa",
    images: [["/brand-textile.svg", "Leher textile canopy installation"]],
    units: 2,
    codePrefix: "WW-LTC",
    impact: [
      ["TEXTILE_WASTE_DIVERTED", "6.2", "kg", "Demo estimate recorded as an explicit product metric."],
      ["REUSE_CYCLES_TARGET", "50", "cycles", "Demo lifecycle target; methodology to be defined later."],
    ],
  },
  {
    name: "Kora Ceremony Runner Collection",
    slug: "kora-ceremony-runner-collection",
    categorySlug: "table-decor",
    shortDescription: "Textured runners for ceremony aisles, gifting tables, and intimate gatherings.",
    description:
      "Kora is a flexible collection of hand-finished textile runners designed to move between ceremony and reception settings. Demo catalogue data for Phase 1.",
    purchasePrice: "4500.00",
    material: "Upcycled cotton and handloom surplus fabric",
    dimensions: "Collection of 3 runners, 250 cm each",
    weight: "1.900",
    color: "Cocoa, wheat, and charcoal",
    images: [["/brand-textile.svg", "Kora ceremony runner collection"]],
    units: 6,
    codePrefix: "WW-KRC",
    impact: [["TEXTILE_WASTE_DIVERTED", "1.5", "kg", "Demo estimate recorded as an explicit product metric."]],
  },
];

async function main() {
  console.log("Seeding Waste Weavers demo data...");

  const demoCustomerPasswordHash = await hashPassword("DemoCustomer2026!");
  const demoAdminPasswordHash = await hashPassword("DemoAdmin2026!");

  const categoryBySlug = new Map<string, string>();
  for (const category of categories) {
    const saved = await prisma.category.upsert({
      where: { slug: category.slug },
      update: category,
      create: category,
    });
    categoryBySlug.set(saved.slug, saved.id);
  }

  for (const product of products) {
    const categoryId = categoryBySlug.get(product.categorySlug);
    if (!categoryId) throw new Error(`Missing category for ${product.slug}`);

    const saved = await prisma.product.upsert({
      where: { slug: product.slug },
      update: {
        name: product.name,
        shortDescription: product.shortDescription,
        description: product.description,
        purchasePrice: product.purchasePrice,
        currency: "INR",
        rentalPricingConfig: DEMO_RENTAL_PRICING,
        rentalPricingNotes: "Demo-only PER_DAY configuration at ₹2,500/day. Final commercial pricing convention remains unresolved.",
        rentable: true,
        purchasable: true,
        status: "ACTIVE",
        material: product.material,
        dimensions: product.dimensions,
        weight: product.weight,
        color: product.color,
        categoryId,
      },
      create: {
        name: product.name,
        slug: product.slug,
        shortDescription: product.shortDescription,
        description: product.description,
        purchasePrice: product.purchasePrice,
        currency: "INR",
        rentalPricingConfig: DEMO_RENTAL_PRICING,
        rentalPricingNotes: "Demo-only PER_DAY configuration at ₹2,500/day. Final commercial pricing convention remains unresolved.",
        rentable: true,
        purchasable: true,
        status: "ACTIVE",
        material: product.material,
        dimensions: product.dimensions,
        weight: product.weight,
        color: product.color,
        categoryId,
      },
    });

    await prisma.productImage.deleteMany({ where: { productId: saved.id } });
    await prisma.productImage.createMany({
      data: product.images.map(([url, altText], sortOrder) => ({
        productId: saved.id,
        url,
        altText,
        sortOrder,
      })),
    });

    await prisma.impactMetric.deleteMany({ where: { productId: saved.id } });
    await prisma.impactMetric.createMany({
      data: product.impact.map(([metricType, value, unit, description]) => ({
        productId: saved.id,
        metricType,
        value,
        unit,
        description,
      })),
    });

    for (let index = 1; index <= product.units; index += 1) {
      await prisma.inventoryUnit.upsert({
        where: { inventoryCode: `${product.codePrefix}-${String(index).padStart(3, "0")}` },
        update: { productId: saved.id, status: "AVAILABLE", condition: "GOOD" },
        create: {
          productId: saved.id,
          inventoryCode: `${product.codePrefix}-${String(index).padStart(3, "0")}`,
          status: "AVAILABLE",
          condition: "GOOD",
        },
      });
    }
  }

  const demoCustomer = await prisma.user.upsert({
    where: { email: "demo.customer@wasteweavers.example" },
    update: {
      name: "Demo Customer",
      phone: "+91 90000 00001",
      passwordHash: demoCustomerPasswordHash,
      role: UserRole.CUSTOMER,
    },
    create: {
      name: "Demo Customer",
      email: "demo.customer@wasteweavers.example",
      phone: "+91 90000 00001",
      passwordHash: demoCustomerPasswordHash,
      role: UserRole.CUSTOMER,
    },
  });

  await prisma.user.upsert({
    where: { email: "demo.admin@wasteweavers.example" },
    update: {
      name: "Demo Admin",
      phone: "+91 90000 00002",
      passwordHash: demoAdminPasswordHash,
      role: UserRole.ADMIN,
    },
    create: {
      name: "Demo Admin",
      email: "demo.admin@wasteweavers.example",
      phone: "+91 90000 00002",
      passwordHash: demoAdminPasswordHash,
      role: UserRole.ADMIN,
    },
  });

  await prisma.address.deleteMany({ where: { userId: demoCustomer.id } });
  await prisma.address.create({
    data: {
      userId: demoCustomer.id,
      label: "Demo delivery address",
      recipientName: "Demo Customer",
      line1: "12 Artisan Lane",
      line2: "Indiranagar",
      city: "Bengaluru",
      state: "Karnataka",
      postalCode: "560038",
      country: "IN",
      phone: "+91 90000 00001",
    },
  });

  console.log(`Seeded ${products.length} demo products, categories, images, inventory units, impact metrics, and demo users.`);
  console.log("No orders or rentals were seeded so availability remains unambiguous for later testing.");
}

main()
  .catch((error: unknown) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
