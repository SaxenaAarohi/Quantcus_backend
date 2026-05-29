const prisma = require("../config/prisma");
const { validateProduct, computeQualityScore } = require("./validationService");
const { buildListingAlerts } = require("./alertService");

async function saveAndValidateProduct(productData, skuCounts = {}, options = {}) {
  const issues = validateProduct(productData, skuCounts);
  const qualityScore = computeQualityScore(issues);

  const data = {
    skuId: productData.skuId,
    title: productData.title || null,
    description: productData.description || null,
    brand: productData.brand || null,
    category: productData.category || null,
    price: productData.price ?? null,
    mrp: productData.mrp ?? null,
    imageUrl: productData.imageUrl || null,
    productUrl: productData.productUrl || null,
    availability: productData.availability || null,
    color: productData.color || null,
    size: productData.size || null,
    material: productData.material || null,
    source: productData.source || "MANUAL",
    enhanceTitle: !!productData.enhanceTitle,
    extractedAttributes: productData.extractedAttributes || null,
    qualityScore,
    jobId: productData.jobId || null,
  };

  const product = await prisma.product.upsert({
    where: { skuId: data.skuId },
    update: data,
    create: data,
  });

  await prisma.productIssue.deleteMany({ where: { productId: product.id } });
  if (issues.length > 0) {
    await prisma.productIssue.createMany({
      data: issues.map((issue) => ({ ...issue, productId: product.id })),
    });
  }

  if (!options.skipAlerts) {
    await prisma.alert.deleteMany({
      where: { productId: product.id, alertType: { not: "PRICE_ABOVE_COMPETITORS" } },
    });
    const listingAlerts = buildListingAlerts(product, issues);
    if (listingAlerts.length > 0) {
      await prisma.alert.createMany({
        data: listingAlerts.map((a) => ({ ...a, productId: product.id })),
      });
    }
  }

  return { product, issues, qualityScore };
}

module.exports = { saveAndValidateProduct };
