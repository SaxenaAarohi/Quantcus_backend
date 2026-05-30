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

function csvCell(value) {
  const s = value === null || value === undefined ? "" : String(value);
  if (/[",\n]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

const getQualityReport = asyncHandler(async (req, res) => {
  const products = await prisma.product.findMany({
    include: { issues: true },
    orderBy: { qualityScore: "asc" },
  });

  const headers = [
    "sku_id", "title", "brand", "category", "price", "mrp", "source",
    "quality_score", "issue_count", "high", "medium", "low", "issue_types",
  ];
  const lines = [headers.join(",")];

  for (const p of products) {
    const high = p.issues.filter((i) => i.severity === "HIGH").length;
    const medium = p.issues.filter((i) => i.severity === "MEDIUM").length;
    const low = p.issues.filter((i) => i.severity === "LOW").length;
    const types = p.issues.map((i) => i.issueType).join("; ");
    const row = [
      p.skuId, p.title, p.brand, p.category, p.price, p.mrp, p.source,
      p.qualityScore, p.issues.length, high, medium, low, types,
    ];
    lines.push(row.map(csvCell).join(","));
  }

  res.setHeader("Content-Type", "text/csv; charset=utf-8");
  res.setHeader("Content-Disposition", 'attachment; filename="product-quality-report.csv"');
  res.send(lines.join("\n"));
});

module.exports = { getQualitySummary, getQualityReport };
