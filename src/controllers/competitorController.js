const fs = require("fs");
const prisma = require("../config/prisma");
const { asyncHandler, toNumber } = require("../utils/helpers");
const { parseCsv } = require("../utils/csv");
const { generateMockCompetitorPrices, comparePrices } = require("../services/competitorService");
const { buildPricingAlert } = require("../services/alertService");
const jobService = require("../services/jobService");

async function refreshPricingAlert(product) {
  const prices = await prisma.competitorPrice.findMany({ where: { productId: product.id } });
  const comparison = comparePrices(product.price, prices);

  await prisma.alert.deleteMany({
    where: { productId: product.id, alertType: "PRICE_ABOVE_COMPETITORS" },
  });
  const alert = buildPricingAlert(product, comparison);
  if (alert) {
    await prisma.alert.create({ data: { ...alert, productId: product.id } });
  }
  return comparison;
}

const uploadCompetitorCsv = asyncHandler(async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: "No CSV file uploaded. Use form field 'csv'." });
  }

  const text = fs.readFileSync(req.file.path, "utf8");
  const rows = parseCsv(text);
  if (rows.length === 0) {
    return res.status(400).json({ error: "CSV is empty or invalid." });
  }

  const failedRows = [];
  let saved = 0;
  const touchedProductIds = new Set();

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    const skuId = (row.sku_id || "").trim();
    const product = skuId ? await prisma.product.findUnique({ where: { skuId } }) : null;
    const price = toNumber(row.competitor_price);

    if (!product) {
      failedRows.push({ row: i + 2, reason: `No product found for sku_id "${skuId}".` });
      continue;
    }
    if (price === null) {
      failedRows.push({ row: i + 2, reason: "Invalid competitor_price." });
      continue;
    }

    await prisma.competitorPrice.create({
      data: {
        skuId,
        productName: row.product_name || product.title,
        platform: row.platform || "Unknown",
        competitorUrl: row.competitor_url || null,
        competitorPrice: price,
        currency: row.currency || "INR",
        lastCheckedAt: row.last_checked_at ? new Date(row.last_checked_at) : new Date(),
        productId: product.id,
      },
    });
    saved++;
    touchedProductIds.add(product.id);
  }

  for (const id of touchedProductIds) {
    const product = await prisma.product.findUnique({ where: { id } });
    await refreshPricingAlert(product);
  }

  res.status(201).json({ savedCount: saved, failedRows });
});

const refreshPrices = asyncHandler(async (req, res) => {
  const { skuId } = req.query;

  const job = await jobService.createJob("PRICE_REFRESH");
  try {
    await jobService.startJob(job.id);

    const products = skuId
      ? await prisma.product.findMany({ where: { skuId } })
      : await prisma.product.findMany();

    if (products.length === 0) {
      await jobService.completeJob(job.id, { message: "No products to refresh." });
      return res.json({ jobId: job.id, refreshed: 0 });
    }

    let refreshed = 0;
    const significantDrops = [];

    for (let i = 0; i < products.length; i++) {
      const product = products[i];

      const previous = await prisma.competitorPrice.findMany({ where: { productId: product.id } });
      const prevLowest = previous.length ? Math.min(...previous.map((p) => p.competitorPrice)) : null;

      await prisma.competitorPrice.deleteMany({ where: { productId: product.id } });
      const fresh = generateMockCompetitorPrices(product);
      await prisma.competitorPrice.createMany({
        data: fresh.map((f) => ({ ...f, productId: product.id })),
      });

      const newLowest = Math.min(...fresh.map((f) => f.competitorPrice));

      if (prevLowest !== null && newLowest < prevLowest * 0.85) {
        await prisma.alert.create({
          data: {
            alertType: "COMPETITOR_PRICE_DROP",
            severity: "MEDIUM",
            message: `[${product.skuId}] Competitor price dropped from ₹${prevLowest} to ₹${newLowest}.`,
            productId: product.id,
          },
        });
        significantDrops.push(product.skuId);
      }

      await refreshPricingAlert(product);
      refreshed++;
      await jobService.updateProgress(job.id, Math.round(((i + 1) / products.length) * 90) + 10, `Refreshed ${i + 1}/${products.length}.`);
    }

    await jobService.completeJob(job.id, {
      status: "COMPLETED",
      message: `Refreshed competitor prices for ${refreshed} product(s). ${significantDrops.length} significant drop(s).`,
    });

    res.json({ jobId: job.id, refreshed, significantDrops });
  } catch (err) {
    await jobService.failJob(job.id, err.message);
    throw err;
  }
});

module.exports = { uploadCompetitorCsv, refreshPrices };
