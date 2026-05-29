const prisma = require("../config/prisma");
const { asyncHandler } = require("../utils/helpers");

const getQualitySummary = asyncHandler(async (req, res) => {
  const products = await prisma.product.findMany({ include: { issues: true } });
  const issues = await prisma.productIssue.findMany();
  const alerts = await prisma.alert.findMany();

  const totalProducts = products.length;

  const issuesBySeverity = { HIGH: 0, MEDIUM: 0, LOW: 0 };
  issues.forEach((i) => {
    if (issuesBySeverity[i.severity] !== undefined) issuesBySeverity[i.severity]++;
  });

  const missingImageCount = issues.filter((i) => i.issueType === "MISSING_IMAGE").length;
  const invalidPriceCount = issues.filter((i) => i.issueType === "INVALID_PRICE").length;

  const weakListings = products.filter((p) =>
    p.issues.some((i) => i.severity === "HIGH" || i.severity === "MEDIUM")
  ).length;

  const avgQualityScore =
    totalProducts > 0
      ? Math.round(products.reduce((sum, p) => sum + (p.qualityScore || 0), 0) / totalProducts)
      : 0;

  const alertsBySeverity = { HIGH: 0, MEDIUM: 0, LOW: 0 };
  alerts.forEach((a) => {
    if (alertsBySeverity[a.severity] !== undefined) alertsBySeverity[a.severity]++;
  });

  res.json({
    totalProducts,
    issuesBySeverity,
    missingImageCount,
    invalidPriceCount,
    weakListings,
    avgQualityScore,
    totalAlerts: alerts.length,
    alertsBySeverity,
    totalIssues: issues.length,
  });
});

module.exports = { getQualitySummary };
