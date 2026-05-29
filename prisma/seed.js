require("dotenv").config();
const prisma = require("../src/config/prisma");
const { saveAndValidateProduct } = require("../src/services/productService");
const { enhanceTitle } = require("../src/services/titleEnhancementService");
const { generateMockCompetitorPrices, comparePrices } = require("../src/services/competitorService");
const { buildPricingAlert } = require("../src/services/alertService");

const SAMPLE_PRODUCTS = [
  {
    skuId: "SHOE001",
    title: "Nike Blue Running Shoes",
    description: "Comfortable lightweight running shoes with mesh upper for daily training.",
    brand: "Nike",
    category: "Shoes",
    price: 3999,
    mrp: 4999,
    imageUrl: "https://loremflickr.com/400/400/running,shoes?lock=1",
    productUrl: "https://flipkart.com/p/shoe001",
    availability: "in_stock",
    color: "Blue",
    size: "9",
    material: "Mesh",
    source: "CSV",
    enhanceTitle: true,
  },
  {
    skuId: "DRESS001",
    title: "Red Dress",
    description: "",
    brand: "Zara",
    category: "Dresses",
    price: 1799,
    mrp: 2499,
    imageUrl: "https://loremflickr.com/400/400/red,dress?lock=2",
    availability: "in_stock",
    color: "Red",
    size: "M",
    material: "Cotton",
    source: "CSV",
  },
  {
    skuId: "BAG001",
    title: "",
    description: "A backpack",
    brand: "",
    category: "Bags",
    price: 1299,
    mrp: 999,
    imageUrl: "https://loremflickr.com/400/400/backpack?lock=3",
    availability: "out_of_stock",
    source: "CSV",
  },
  {
    skuId: "EARBUD001",
    title: "boAt Earbuds",
    description: "True wireless earbuds with deep bass and long battery life for music lovers.",
    brand: "boAt",
    category: "Electronics",
    price: 1499,
    mrp: 2999,
    imageUrl: "https://loremflickr.com/400/400/earbuds?lock=4",
    availability: "in_stock",
    color: "White",
    material: "Plastic",
    source: "CSV",
  },
];

async function main() {
  console.log("Clearing existing data...");
  await prisma.alert.deleteMany();
  await prisma.competitorPrice.deleteMany();
  await prisma.productIssue.deleteMany();
  await prisma.product.deleteMany();
  await prisma.job.deleteMany();

  console.log("Seeding products...");
  for (const data of SAMPLE_PRODUCTS) {
    const { product } = await saveAndValidateProduct(data);

    if (data.enhanceTitle) {
      const e = enhanceTitle(product);
      await prisma.product.update({
        where: { id: product.id },
        data: { enhancedTitle: e.enhancedTitle, enhancedTitleReason: e.reason, suggestedKeywords: e.keywords },
      });
    }

    const prices = generateMockCompetitorPrices(product);
    await prisma.competitorPrice.createMany({
      data: prices.map((p) => ({ ...p, productId: product.id })),
    });
    const comparison = comparePrices(product.price, prices);
    const alert = buildPricingAlert(product, comparison);
    if (alert) await prisma.alert.create({ data: { ...alert, productId: product.id } });

    console.log(`  - ${product.skuId} (quality ${product.qualityScore})`);
  }

  console.log("Seeding dummy jobs...");
  await seedDummyJobs();

  console.log("Trimming alerts for demo...");
  const allAlerts = await prisma.alert.findMany({ orderBy: { createdAt: "asc" } });
  const keepIds = allAlerts.slice(0, 2).map((a) => a.id);
  if (keepIds.length) {
    await prisma.alert.deleteMany({ where: { id: { notIn: keepIds } } });
  }

  const [alertCount, jobCount, productCount] = await Promise.all([
    prisma.alert.count(),
    prisma.job.count(),
    prisma.product.count(),
  ]);
  console.log(`Seed complete. products=${productCount}, alerts=${alertCount}, jobs=${jobCount}`);
}

async function seedDummyJobs() {
  const now = Date.now();
  const min = 60 * 1000;

  const jobs = [
    {
      type: "VIDEO_PROCESSING",
      status: "COMPLETED",
      progress: 100,
      message: "Video processed successfully.",
      startedAt: new Date(now - 30 * min),
      completedAt: new Date(now - 29 * min),
    },
    {
      type: "CSV_VALIDATION",
      status: "PARTIALLY_COMPLETED",
      progress: 100,
      message: "Saved 4 products. 2 rows failed.",
      errorDetails: JSON.stringify([
        { row: 6, reason: "Invalid price (negative)." },
        { row: 7, reason: "Duplicate SKU id." },
      ]),
      startedAt: new Date(now - 20 * min),
      completedAt: new Date(now - 19 * min),
    },
    {
      type: "PRICE_REFRESH",
      status: "RUNNING",
      progress: 55,
      message: "Refreshed 2/4 products.",
      startedAt: new Date(now - 1 * min),
    },
  ];

  for (const job of jobs) {
    await prisma.job.create({ data: job });
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
