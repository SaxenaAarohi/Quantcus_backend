const { COMPETITOR_PLATFORMS } = require("../utils/mockData");
const { round2, randomItem } = require("../utils/helpers");

function generateMockCompetitorPrices(product) {
  const basePrice = product.price && product.price > 0 ? product.price : 1000;

  return COMPETITOR_PLATFORMS.map((platform) => {

    const factor = 0.8 + Math.random() * 0.35;
    const competitorPrice = round2(basePrice * factor);
    return {
      skuId: product.skuId,
      productName: product.title || product.skuId,
      platform,
      competitorUrl: `https://example.com/${platform.toLowerCase()}/${product.skuId}`,
      competitorPrice,
      currency: "INR",
      lastCheckedAt: new Date(),
    };
  });
}

function comparePrices(ourPrice, competitorPrices) {
  if (!competitorPrices || competitorPrices.length === 0) {
    return {
      ourPrice,
      lowest: null,
      highest: null,
      average: null,
      priceGap: null,
      percentDifference: null,
      recommendedAction: "No competitor data available. Add competitor prices to compare.",
    };
  }

  const values = competitorPrices.map((c) => c.competitorPrice);
  const lowest = Math.min(...values);
  const highest = Math.max(...values);
  const average = round2(values.reduce((a, b) => a + b, 0) / values.length);

  let priceGap = null;
  let percentDifference = null;
  let recommendedAction = "Pricing looks competitive. No action needed.";

  if (ourPrice && ourPrice > 0) {
    priceGap = round2(ourPrice - lowest);
    percentDifference = round2(((ourPrice - lowest) / lowest) * 100);

    if (percentDifference > 10) {
      recommendedAction = `Our price is ${percentDifference}% above the lowest competitor (₹${lowest}). Consider lowering the price.`;
    } else if (percentDifference < -10) {
      recommendedAction = `Our price is well below competitors. Consider raising the price to improve margin.`;
    }
  } else {
    recommendedAction = "Our price is missing or invalid. Set a valid price before comparing.";
  }

  return { ourPrice, lowest, highest, average, priceGap, percentDifference, recommendedAction };
}

module.exports = { generateMockCompetitorPrices, comparePrices };
