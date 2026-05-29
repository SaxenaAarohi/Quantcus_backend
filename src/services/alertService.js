function buildListingAlerts(product, issues) {
  const alerts = [];

  issues.forEach((issue) => {
    if (issue.issueType === "MISSING_TITLE" || issue.issueType === "INVALID_PRICE") {
      alerts.push({
        alertType: issue.issueType,
        severity: "HIGH",
        message: `[${product.skuId}] ${issue.message}`,
      });
    } else if (issue.issueType === "WEAK_TITLE" || issue.issueType === "MISSING_ATTRIBUTES") {
      alerts.push({
        alertType: issue.issueType,
        severity: "MEDIUM",
        message: `[${product.skuId}] ${issue.message}`,
      });
    } else if (issue.issueType === "WEAK_DESCRIPTION" || issue.issueType === "OUT_OF_STOCK") {
      alerts.push({
        alertType: issue.issueType,
        severity: "LOW",
        message: `[${product.skuId}] ${issue.message}`,
      });
    }
  });

  return alerts;
}

function buildPricingAlert(product, comparison) {
  if (
    comparison &&
    comparison.percentDifference !== null &&
    comparison.percentDifference > 10
  ) {
    return {
      alertType: "PRICE_ABOVE_COMPETITORS",
      severity: "HIGH",
      message: `[${product.skuId}] Flipkart price is ${comparison.percentDifference}% above the lowest competitor (₹${comparison.lowest}).`,
    };
  }
  return null;
}

module.exports = { buildListingAlerts, buildPricingAlert };
