const IMPACT = { HIGH: 25, MEDIUM: 12, LOW: 5 };
const PRIORITY_RANK = { HIGH: 3, MEDIUM: 2, LOW: 1 };

const ISSUE_TITLE = {
  MISSING_TITLE: "Add a product title",
  WEAK_TITLE: "Strengthen the product title",
  MISSING_BRAND: "Add the brand",
  INVALID_PRICE: "Set a valid price",
  MRP_LOWER_THAN_PRICE: "Fix MRP below selling price",
  MISSING_IMAGE: "Add a product image",
  BROKEN_IMAGE_URL: "Replace the broken image URL",
  DUPLICATE_SKU: "Resolve the duplicate SKU",
  WEAK_DESCRIPTION: "Expand the description",
  MISSING_ATTRIBUTES: "Add missing attributes",
  OUT_OF_STOCK: "Restock or flag out-of-stock",
};

function generateRecommendations(product, issues = [], comparison = null) {
  const recs = [];

  for (const issue of issues) {
    if (issue.severity !== "HIGH") continue;
    recs.push({
      type: "FIX_ISSUE",
      issueType: issue.issueType,
      priority: "HIGH",
      title: ISSUE_TITLE[issue.issueType] || issue.issueType,
      action: issue.suggestedFix || issue.message,
      estimatedImpact: IMPACT.HIGH,
    });
  }

  if (comparison && comparison.percentDifference !== null && comparison.percentDifference > 10) {
    recs.push({
      type: "PRICING",
      priority: "HIGH",
      title: "Lower your price to stay competitive",
      action: comparison.recommendedAction,
      estimatedImpact: 0,
    });
  }

  if (recs.length === 0) {
    recs.push({
      type: "ENHANCE_TITLE",
      priority: "MEDIUM",
      title: "Generate an SEO-enhanced title",
      action: "Use product attributes and trending keywords to improve search visibility.",
      estimatedImpact: 0,
    });
  }

  recs.sort((a, b) => {
    if (b.estimatedImpact !== a.estimatedImpact) return b.estimatedImpact - a.estimatedImpact;
    return (PRIORITY_RANK[b.priority] || 0) - (PRIORITY_RANK[a.priority] || 0);
  });

  return recs;
}

module.exports = { generateRecommendations };
