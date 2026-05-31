const prisma = require("../config/prisma");
const { asyncHandler } = require("../utils/helpers");
const { saveAndValidateProduct } = require("../services/productService");
const { enhanceTitle } = require("../services/titleEnhancementService");
const { comparePrices } = require("../services/competitorService");
const { generateRecommendations } = require("../services/recommendationService");

const listProducts = asyncHandler(async (req, res) => {
  const { severity, category, alert } = req.query;

  let products = await prisma.product.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      issues: true,
      alerts: true,
      _count: { select: { issues: true, alerts: true } },
    },
  });

  if (category) {
    products = products.filter((p) => (p.category || "").toLowerCase() === category.toLowerCase());
  }
  if (severity) {
    products = products.filter((p) => p.issues.some((i) => i.severity === severity.toUpperCase()));
  }
  if (alert === "true") {
    products = products.filter((p) => p.alerts.length > 0);
  }

  res.json(products);
});

const getProduct = asyncHandler(async (req, res) => {
  const product = await prisma.product.findUnique({
    where: { skuId: req.params.skuId },
    include: { issues: true, competitorPrices: true, alerts: true },
  });
  if (!product) return res.status(404).json({ error: "Product not found." });

  const comparison = comparePrices(product.price, product.competitorPrices);
  const recommendations = generateRecommendations(product, product.issues, comparison);
  res.json({ ...product, recommendations });
});

const getProductIssues = asyncHandler(async (req, res) => {
  const product = await prisma.product.findUnique({
    where: { skuId: req.params.skuId },
    include: { issues: true },
  });
  if (!product) return res.status(404).json({ error: "Product not found." });
  res.json(product.issues);
});

const updateProduct = asyncHandler(async (req, res) => {
  const existing = await prisma.product.findUnique({ where: { skuId: req.params.skuId } });
  if (!existing) return res.status(404).json({ error: "Product not found." });

  const merged = { ...existing, ...req.body, skuId: existing.skuId, source: "MANUAL" };
  const { product, issues, qualityScore } = await saveAndValidateProduct(merged);
  res.json({ product, issues, qualityScore });
});

const enhanceProductTitle = asyncHandler(async (req, res) => {
  const product = await prisma.product.findUnique({ where: { skuId: req.params.skuId } });
  if (!product) return res.status(404).json({ error: "Product not found." });

  const enhancement = enhanceTitle(product);
  const updated = await prisma.product.update({
    where: { id: product.id },
    data: {
      enhanceTitle: true,
      enhancedTitle: enhancement.enhancedTitle,
      enhancedTitleReason: enhancement.reason,
      suggestedKeywords: enhancement.keywords,
    },
  });

  res.json({
    originalTitle: enhancement.originalTitle,
    attributes: enhancement.attributes,
    keywords: enhancement.keywords,
    enhancedTitle: enhancement.enhancedTitle,
    reason: enhancement.reason,
    product: updated,
  });
});

const getCompetitorPrices = asyncHandler(async (req, res) => {
  const product = await prisma.product.findUnique({
    where: { skuId: req.params.skuId },
    include: { competitorPrices: { orderBy: { lastCheckedAt: "desc" } } },
  });
  if (!product) return res.status(404).json({ error: "Product not found." });

  const comparison = comparePrices(product.price, product.competitorPrices);
  res.json({ prices: product.competitorPrices, comparison });
});

module.exports = {
  listProducts,
  getProduct,
  getProductIssues,
  updateProduct,
  enhanceProductTitle,
  getCompetitorPrices,
};
